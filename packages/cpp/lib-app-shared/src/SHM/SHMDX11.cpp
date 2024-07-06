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


#include <IRacingTools/SDK/Utils/Tracing.h>
#include <IRacingTools/Shared/Macros.h>
#include <IRacingTools/Shared/SHM/SHMDX11.h>

namespace IRacingTools::Shared::SHM::DX11 {

Texture::Texture(
  const PixelSize& dimensions,
  uint8_t swapchainIndex,
  const winrt::com_ptr<ID3D11Device5>& device,
  const winrt::com_ptr<ID3D11DeviceContext4>& context)
  : IPCClientTexture(dimensions, swapchainIndex),
    device_(device),
    context_(context) {
}

Texture::~Texture() = default;

ID3D11Texture2D* Texture::getD3D11Texture() const noexcept {
  return cacheTexture_.get();
}

ID3D11ShaderResourceView* Texture::getD3D11ShaderResourceView() noexcept {
  if (!cacheShaderResourceView_) {
    check_hresult(device_->CreateShaderResourceView(
      cacheTexture_.get(), nullptr, cacheShaderResourceView_.put()));
  }
  return cacheShaderResourceView_.get();
}

void Texture::copyFrom(
  ID3D11Texture2D* sourceTexture,
  ID3D11Fence* fenceIn,
  uint64_t fenceInValue,
  ID3D11Fence* fenceOut,
  uint64_t fenceOutValue) noexcept {
  // IRT_TraceLoggingScope("SHM::D3D11::Texture::copyFrom");

  if (!cacheTexture_) {
    // IRT_TraceLoggingScope("SHM/D3D11/CreateCacheTexture");
    D3D11_TEXTURE2D_DESC desc;
    sourceTexture->GetDesc(&desc);
    check_hresult(
      device_->CreateTexture2D(&desc, nullptr, cacheTexture_.put()));
  }

  {
    // IRT_TraceLoggingScope("SHM/D3D11/FenceIn");
    check_hresult(context_->Wait(fenceIn, fenceInValue));
  }

  {
    // IRT_TraceLoggingScope("SHM/D3D11/CopySubresourceRegion");
    context_->CopySubresourceRegion(
      cacheTexture_.get(), 0, 0, 0, 0, sourceTexture, 0, nullptr);
  }

  {
    // IRT_LoggingScope("SHM/D3D11/FenceOut");
    check_hresult(context_->Signal(fenceOut, fenceOutValue));
  }
}

SHMDX11CachedReader::SHMDX11CachedReader(ConsumerKind consumerKind)
  : SHM::SHMCachedReader(this, consumerKind) {
  // IRT_TraceLoggingScope("SHM::D3D11::SHMDX11CachedReader::cachedReader()");
}

SHMDX11CachedReader::~SHMDX11CachedReader() {
  // IRT_TraceLoggingScope("SHM::D3D11::SHMDX11CachedReader::~SHMDX11CachedReader()");
  this->waitForPendingCopies();
}

void SHMDX11CachedReader::waitForPendingCopies() {
  // IRT_TraceLoggingScope(
  //   "SHM::D3D11::SHMDX11CachedReader::waitForPendingCopies()");
  if (!copyFence_) {
    return;
  }
  winrt::handle event {CreateEventEx(nullptr, nullptr, 0, GENERIC_ALL)};
  copyFence_.fence_->SetEventOnCompletion(copyFence_.value_, event.get());
  WaitForSingleObject(event.get(), INFINITE);
}

void SHMDX11CachedReader::initializeCache(
  ID3D11Device* device,
  uint8_t swapchainLength) {
  // IRT_TraceLoggingScope(
  //   "SHM::D3D11::SHMDX11CachedReader::initializeCache()",
  //   TraceLoggingValue(swapchainLength, "swapchainLength"));

  if (device != device_.get()) {
    this->waitForPendingCopies();
    device_ = {};
    deviceContext_ = {};
    copyFence_ = {};

    check_hresult(device->QueryInterface(device_.put()));
    winrt::com_ptr<ID3D11DeviceContext> context;
    device->GetImmediateContext(context.put());
    deviceContext_ = context.as<ID3D11DeviceContext4>();

    winrt::com_ptr<IDXGIDevice> dxgiDevice;
    check_hresult(device->QueryInterface(IID_PPV_ARGS(dxgiDevice.put())));
    winrt::com_ptr<IDXGIAdapter> dxgiAdapter;
    check_hresult(dxgiDevice->GetAdapter(dxgiAdapter.put()));
    DXGI_ADAPTER_DESC desc {};
    check_hresult(dxgiAdapter->GetDesc(&desc));

    deviceLUID_ = std::bit_cast<uint64_t>(desc.AdapterLuid);
    // spdlog::debug(
    //   L"D3D11 SHM reader using adapter '{}' (LUID {:#x})",
    //   desc.Description,
    //   std::bit_cast<uint64_t>(deviceLUID_));

    winrt::check_hresult(device_->CreateFence(
      0, D3D11_FENCE_FLAG_NONE, IID_PPV_ARGS(copyFence_.fence_.put())));
  }

  SHM::SHMCachedReader::initializeCache(deviceLUID_, swapchainLength);
}

void SHMDX11CachedReader::releaseIPCHandles() {
  // IRT_TraceLoggingScope(
  //   "SHM::D3D11::SHMDX11CachedReader::releaseIPCHandles");
  if (ipcFences_.empty()) {
    return;
  }
  this->waitForPendingCopies();

  std::vector<HANDLE> events;
  for (const auto& [fenceHandle, fenceAndValue]: ipcFences_) {
    auto event = CreateEventEx(nullptr, nullptr, 0, GENERIC_ALL);
    fenceAndValue.fence_->SetEventOnCompletion(fenceAndValue.value_, event);
    events.push_back(event);
  }

  WaitForMultipleObjects(events.size(), events.data(), true, INFINITE);
  for (const auto event: events) {
    CloseHandle(event);
  }

  ipcFences_.clear();
  ipcTextures_.clear();
}

void SHMDX11CachedReader::copy(
  HANDLE sourceHandle,
  IPCClientTexture* destinationTexture,
  HANDLE fenceHandle,
  uint64_t fenceValueIn) noexcept {
  //IRT_TraceLoggingScope("SHM::D3D11::SHMDX11CachedReader::copy()");
  const auto source = this->getIPCTexture(sourceHandle);

  auto fenceAndValue = this->getIPCFence(fenceHandle);

  reinterpret_cast<SHM::DX11::Texture*>(destinationTexture)
    ->copyFrom(
      source,
      fenceAndValue->fence_.get(),
      fenceValueIn,
      copyFence_.fence_.get(),
      ++copyFence_.value_);
  fenceAndValue->value_ = fenceValueIn;
}

std::shared_ptr<SHM::IPCClientTexture> SHMDX11CachedReader::createIPCClientTexture(
  const PixelSize& dimensions,
  uint8_t swapchainIndex) noexcept {
  // IRT_TraceLoggingScope(
  //   "SHM::D3D11::SHMDX11CachedReader::createIPCClientTexture()");
  return std::make_shared<SHM::DX11::Texture>(
    dimensions, swapchainIndex, device_, deviceContext_);
}

SHMDX11CachedReader::FenceAndValue* SHMDX11CachedReader::getIPCFence(HANDLE handle) noexcept {
  if (ipcFences_.contains(handle)) {
    return &ipcFences_.at(handle);
  }

  // IRT_TraceLoggingScope("SHM::D3D11::SHMDX11CachedReader::getIPCFence()");
  winrt::com_ptr<ID3D11Fence> fence;
  check_hresult(device_->OpenSharedFence(handle, IID_PPV_ARGS(fence.put())));
  ipcFences_.emplace(handle, FenceAndValue {fence});
  return &ipcFences_.at(handle);
}

ID3D11Texture2D* SHMDX11CachedReader::getIPCTexture(HANDLE handle) noexcept {
  if (ipcTextures_.contains(handle)) {
    return ipcTextures_.at(handle).get();
  }

  // IRT_TraceLoggingScope("SHM::D3D11::SHMDX11CachedReader::getIPCTexture()");

  winrt::com_ptr<ID3D11Texture2D> texture;
  check_hresult(
    device_->OpenSharedResource1(handle, IID_PPV_ARGS(texture.put())));
  ipcTextures_.emplace(handle, texture);
  return texture.get();
}

}