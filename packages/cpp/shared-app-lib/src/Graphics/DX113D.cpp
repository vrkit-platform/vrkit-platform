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

#include <IRacingTools/Shared/Graphics/DX113D.h>
#include <IRacingTools/Shared/Macros.h>
#include <IRacingTools/SDK/Utils/ScopeHelpers.h>


namespace IRacingTools::Shared::Graphics {

struct SavedState::Impl {
  winrt::com_ptr<ID3D11DeviceContext1> context;
  winrt::com_ptr<ID3DDeviceContextState> state;
  static thread_local bool ThreadHasSavedState;
};

thread_local bool SavedState::Impl::ThreadHasSavedState {false};

SavedState::SavedState(const winrt::com_ptr<ID3D11DeviceContext>& ctx)
  : SavedState(ctx.get()) {
}

SavedState::SavedState(ID3D11DeviceContext* ctx) {
  // using winrt::check_hresult;

  Impl::ThreadHasSavedState = true;
  impl_ = new Impl {};
  check_hresult(ctx->QueryInterface(IID_PPV_ARGS(impl_->context.put())));

  winrt::com_ptr<ID3D11Device> device;
  ctx->GetDevice(device.put());
  auto featureLevel = device->GetFeatureLevel();

  winrt::com_ptr<ID3DDeviceContextState> newState;
  {
    check_hresult(device.as<ID3D11Device1>()->CreateDeviceContextState(
      (device->GetCreationFlags() & D3D11_CREATE_DEVICE_SINGLETHREADED)
        ? D3D11_1_CREATE_DEVICE_CONTEXT_STATE_SINGLETHREADED
        : 0,
      &featureLevel,
      1,
      D3D11_SDK_VERSION,
      __uuidof(ID3D11Device),
      nullptr,
      newState.put()));
  }
  {
    impl_->context->SwapDeviceContextState(
      newState.get(), impl_->state.put());
  }
}

SavedState::~SavedState() {
  impl_->context->SwapDeviceContextState(impl_->state.get(), nullptr);
  Impl::ThreadHasSavedState = false;
  delete impl_;
}

SpriteBatch::SpriteBatch(ID3D11Device* device) {
  device_.copy_from(device);
  device->GetImmediateContext(deviceContext_.put());

  dxtkSpriteBatch_
    = std::make_unique<DirectX::SpriteBatch>(deviceContext_.get());
}

SpriteBatch::~SpriteBatch() {

}



void SpriteBatch::begin(
  ID3D11RenderTargetView* rtv,
  const PixelSize& rtvSize,
  std::function<void __cdecl()> setCustomShaders) {
  const D3D11_VIEWPORT viewport {
    0,
    0,
    rtvSize.width<FLOAT>(),
    rtvSize.height<FLOAT>(),
    0,
    1,
  };

  const D3D11_RECT scissorRect {
    0,
    0,
    rtvSize.width<LONG>(),
    rtvSize.height<LONG>(),
  };

  auto ctx = deviceContext_.get();
  ctx->IASetInputLayout(nullptr);
  ctx->VSSetShader(nullptr, nullptr, 0);
  ctx->RSSetViewports(1, &viewport);
  ctx->RSSetScissorRects(1, &scissorRect);
  ctx->OMSetRenderTargets(1, &rtv, nullptr);
  ctx->OMSetDepthStencilState(nullptr, 0);
  ctx->OMSetBlendState(nullptr, nullptr, ~static_cast<UINT>(0));

  dxtkSpriteBatch_->Begin(
    DirectX::DX11::SpriteSortMode_Deferred,
    nullptr,
    nullptr,
    nullptr,
    nullptr,
    setCustomShaders);

  target_ = rtv;
}

void SpriteBatch::clear(DirectX::XMVECTORF32 color) {
  deviceContext_->ClearRenderTargetView(target_, color);
};

void SpriteBatch::draw(
  ID3D11ShaderResourceView* source,
  const PixelRect& sourceRect,
  const PixelRect& destRect,
  const DirectX::XMVECTORF32 tint) {


  const D3D11_RECT sourceD3DRect = sourceRect;
  const D3D11_RECT destD3DRect = destRect;

  dxtkSpriteBatch_->Draw(source, destD3DRect, &sourceD3DRect, tint);
}

void SpriteBatch::end() {
  dxtkSpriteBatch_->End();
  target_ = nullptr;
}

}// namespace OpenKneeboard::D3D11
