/*
 * OpenKneeboard
 *
 * Copyright (C) 2022 Fred Emmott <fred@fredemmott.com>
 *
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License
 * as published by the Free Software Foundation; version 2.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301,
 * USA.
 */


#define XR_USE_GRAPHICS_API_D3D11

#include <IRacingTools/Shared/SharedAppLibPCH.h>
#include <openxr/openxr_platform.h>

#include <cstdio>
#include <iostream>
#include <utility>

#include <IRacingTools/OpenXR/OpenXROverlayLayer.h>
#include <IRacingTools/OpenXR/OpenXRNext.h>

#include <spdlog/spdlog.h>

#include "loader_interfaces.h"

#include <IRacingTools/SDK/Utils/Tracing.h>
#include <IRacingTools/Shared/Logging/LoggingManager.h>

namespace IRacingTools::OpenXR::DX11 {
using namespace DirectX::SimpleMath;

namespace {
  auto L = Logging::GetCategoryWithType<OpenXRDX11OverlayLayer>();
}
  
OpenXRDX11OverlayLayer::OpenXRDX11OverlayLayer(
  XrInstance instance,
  XrSystemId systemID,
  XrSession session,
  OpenXRRuntimeID runtimeID,
  const std::shared_ptr<OpenXRNext>& next,
  const XrGraphicsBindingD3D11KHR& binding)
  : OpenXROverlayLayer(instance, systemID, session, runtimeID, next) {
  L->debug("{}", __FUNCTION__);
  VRK_TraceLoggingScope("OpenXRDX11Layer()");

  device_.copy_from(binding.device);
  device_->GetImmediateContext(immediateContext_.put());

  renderer_ = std::make_unique<DX11::OpenXRDX11OverlayRenderer>(device_.get());
}

OpenXRDX11OverlayLayer::~OpenXRDX11OverlayLayer() {
  VRK_TraceLoggingScope("~OpenXRDX11Layer()");
}

OpenXRDX11OverlayLayer::DXGIFormats OpenXRDX11OverlayLayer::GetDXGIFormats(
  OpenXRNext* oxr,
  XrSession session) {
  uint32_t formatCount {0};
  if (XR_FAILED(
        oxr->xrEnumerateSwapchainFormats(session, 0, &formatCount, nullptr))) {
    L->warn("Failed to get swapchain format count");
    return {};
  }
  std::vector<int64_t> formats;
  formats.resize(formatCount);
  if (
    XR_FAILED(oxr->xrEnumerateSwapchainFormats(
      session, formatCount, &formatCount, formats.data()))
    || formatCount == 0) {
    L->warn("Failed to enumerate swapchain formats");
    return {};
  }
  for (const auto it: formats) {
    L->debug("Runtime supports swapchain format: {}", it);
  }
  // If this changes, we probably want to change the preference list below
  static_assert(SHM::SHARED_TEXTURE_PIXEL_FORMAT == DXGI_FORMAT_B8G8R8A8_UNORM);
  std::vector<DXGIFormats> preferredFormats {
    {DXGI_FORMAT_B8G8R8A8_UNORM_SRGB, DXGI_FORMAT_B8G8R8A8_UNORM},
    {DXGI_FORMAT_R8G8B8A8_UNORM_SRGB, DXGI_FORMAT_R8G8B8A8_UNORM},
  };
  for (const auto preferred: preferredFormats) {
    auto it = std::ranges::find(formats, preferred.textureFormat);
    if (it != formats.end()) {
      return preferred;
    }
  }

  auto format = static_cast<DXGI_FORMAT>(formats.front());
  return {format, format};
}

XrSwapchain OpenXRDX11OverlayLayer::createSwapchain(
  XrSession session,
  const PixelSize& size) {
  L->debug("{}", __FUNCTION__);
  VRK_TraceLoggingScope("OpenXRDX11Layer::CreateSwapchain()"); // NOLINT(*-pro-type-member-init)

  auto oxr = this->getOpenXR();

  auto formats = GetDXGIFormats(oxr, session);
  L->debug(
    "Creating swapchain with format {}",
    static_cast<int>(formats.textureFormat));

  XrSwapchainCreateInfo swapchainInfo {
    .type = XR_TYPE_SWAPCHAIN_CREATE_INFO,
    .usageFlags = XR_SWAPCHAIN_USAGE_COLOR_ATTACHMENT_BIT,
    .format = formats.textureFormat,
    .sampleCount = 1,
    .width = size.width(),
    .height = size.height(),
    .faceCount = 1,
    .arraySize = 1,
    .mipCount = 1,
  };

  XrSwapchain swapchain {nullptr};

  auto nextResult = oxr->xrCreateSwapchain(session, &swapchainInfo, &swapchain);
  if (XR_FAILED(nextResult)) {
    //L->debug("Failed to create swapchain: {}", nextResult);
    return nullptr;
  }

  uint32_t imageCount = 0;
  nextResult
    = oxr->xrEnumerateSwapchainImages(swapchain, 0, &imageCount, nullptr);
  if (imageCount == 0 || XR_FAILED(nextResult)) {
    // L->debug("No images in swapchain: {}", nextResult);
    return nullptr;
  }

  L->debug("{} images in swapchain", imageCount);
  shm_.initializeCache(device_.get(), static_cast<uint8_t>(imageCount));

  std::vector<XrSwapchainImageD3D11KHR> images;
  images.resize(
    imageCount,
    XrSwapchainImageD3D11KHR {
      .type = XR_TYPE_SWAPCHAIN_IMAGE_D3D11_KHR,
    });
  nextResult = oxr->xrEnumerateSwapchainImages(
    swapchain,
    imageCount,
    &imageCount,
    reinterpret_cast<XrSwapchainImageBaseHeader*>(images.data()));
  if (XR_FAILED(nextResult)) {
    // L->debug("Failed to enumerate images in swapchain: {}", nextResult);
    oxr->xrDestroySwapchain(swapchain);
    return nullptr;
  }

  if (images.at(0).type != XR_TYPE_SWAPCHAIN_IMAGE_D3D11_KHR) {
    L->debug("Swap chain is not a D3D11 swapchain");
    VRK_BREAK;
    oxr->xrDestroySwapchain(swapchain);
    return nullptr;
  }

  std::vector<SwapchainBufferResources> buffers;
  buffers.reserve(imageCount);
  for (size_t i = 0; i < imageCount; ++i) {
    auto& image = images.at(i);
#ifdef DEBUG
    if (image.type != XR_TYPE_SWAPCHAIN_IMAGE_D3D11_KHR) {
      VRK_BREAK;
    }
#endif
    buffers.emplace_back(device_.get(), image.texture, formats.renderTargetViewFormat);
  }

  swapchainResources_[swapchain] = {
    .dimensions = size,
    .bufferResources = std::move(buffers),
  };

  return swapchain;
}

void OpenXRDX11OverlayLayer::releaseSwapchainResources(XrSwapchain swapchain) {
  if (swapchainResources_.contains(swapchain)) {
    swapchainResources_.erase(swapchain);
  }
}

void OpenXRDX11OverlayLayer::renderLayers(
  XrSwapchain swapchain,
  uint32_t swapchainTextureIndex,
  const SHM::Snapshot& snapshot,
  const std::span<SHM::LayerSprite>& layers) {
  VRK_TraceLoggingScope("OpenXRDX11Layer::RenderLayers()");
  Graphics::SavedState savedState(immediateContext_);

  // const auto& sr = swapchainResources_.at(swapchain);

  renderer_->renderLayers(
    swapchainResources_.at(swapchain),
    swapchainTextureIndex,
    snapshot,
    layers,
    RenderMode::ClearAndRender);
}

SHM::SHMCachedReader* OpenXRDX11OverlayLayer::getSHM() {
  return &shm_;
}

}// namespace OpenKneeboard
