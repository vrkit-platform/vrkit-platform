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

#include <IRacingTools/Shared/UI/ViewerWindowDX11Renderer.h>

#include <directxtk/ScreenGrab.h>
#include <IRacingTools/SDK/Utils/Tracing.h>

namespace IRacingTools::Shared::UI {

D3D11Renderer::D3D11Renderer(const winrt::com_ptr<ID3D11Device>& device) {
  d3dDevice_ = device.as<ID3D11Device1>();
  device->GetImmediateContext(d3dDeviceContext_.put());

  spriteBatch_ = std::make_unique<Graphics::SpriteBatch>(device.get());
}

D3D11Renderer::~D3D11Renderer() = default;

std::wstring_view D3D11Renderer::getName() const noexcept {
  return {L"D3D11"};
}

SHM::SHMCachedReader* D3D11Renderer::getSHM() {
  return &cachedReader_;
}

void D3D11Renderer::initialize(uint8_t swapchainLength) {
  cachedReader_.initializeCache(d3dDevice_.get(), swapchainLength);
}

uint64_t D3D11Renderer::render(
  SHM::IPCClientTexture* sourceTexture,
  const PixelRect& sourceRect,
  HANDLE destTextureHandle,
  const PixelSize& destTextureDimensions,
  const PixelRect& destRect,
  [[maybe_unused]] HANDLE fence,
  uint64_t fenceValueIn) {
  //VRK_TraceLoggingScope("Viewer::D3D11Renderer::Render");
  if (destDimensions_ != destTextureDimensions) {
    destHandle_ = {};
  }
  if (sessionId_ != cachedReader_.getSessionID()) {
    destHandle_ = {};
  }
  if (destHandle_ != destTextureHandle) {
    destTexture_ = nullptr;
    destRenderTargetView_ = nullptr;
    check_hresult(d3dDevice_->OpenSharedResource1(
      destTextureHandle, IID_PPV_ARGS(destTexture_.put())));

    check_hresult(d3dDevice_->CreateRenderTargetView(
      destTexture_.get(), nullptr, destRenderTargetView_.put()));
    destHandle_ = destTextureHandle;
    destDimensions_ = destTextureDimensions;
  }

  auto sourceSRV = reinterpret_cast<SHM::DX11::Texture*>(sourceTexture)
                     ->getD3D11ShaderResourceView();

  // We could just use CopySubResourceRegion(), but we might as test
  // D3D11::SpriteBatch a little :)
  //
  // It will also be more consistent with the other viewer
  // renderers.
  spriteBatch_->begin(destRenderTargetView_.get(), destTextureDimensions);
  spriteBatch_->draw(sourceSRV, sourceRect, destRect);
  spriteBatch_->end();

  // No need for a fence wait with D3D11
  return fenceValueIn;
}

void D3D11Renderer::saveTextureToFile(
  SHM::IPCClientTexture* texture,
  const std::filesystem::path& path) {
  check_hresult(DirectX::SaveDDSTextureToFile(
    d3dDeviceContext_.get(),
    reinterpret_cast<SHM::DX11::Texture*>(texture)->getD3D11Texture(),
    path.wstring().c_str()));
}

}// namespace OpenKneeboard::Viewer