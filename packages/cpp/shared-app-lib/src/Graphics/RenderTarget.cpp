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

#include <IRacingTools/Shared/Graphics/RenderTarget.h>
#include <spdlog/spdlog.h>

namespace IRacingTools::Shared::Graphics {


  std::shared_ptr<RenderTarget> RenderTarget::Create(
      const std::shared_ptr<DXResources> &dxr, const winrt::com_ptr<ID3D11Texture2D> &texture) {
    return std::shared_ptr<RenderTarget>(new RenderTarget(dxr, texture));
  }

  std::shared_ptr<RenderTarget> RenderTarget::Create(
      const std::shared_ptr<DXResources> &dxr, nullptr_t texture) {
    return std::shared_ptr<RenderTarget>(new RenderTarget(dxr, texture));
  }

  RenderTarget::~RenderTarget() = default;

  RenderTarget::RenderTarget(
      const std::shared_ptr<DXResources> &dxr, const winrt::com_ptr<ID3D11Texture2D> &texture) : dxr_(dxr) {
    if (texture) {
      this->setD3DTexture(texture);
    }
  }

  void RenderTarget::setD3DTexture(
      const winrt::com_ptr<ID3D11Texture2D> &texture) {
    if (texture == d3dTexture_) {
      return;
    }
    d2dBitmap_ = nullptr;
    d3dRenderTargetView_ = nullptr;
    d3dTexture_ = texture;

    if (!texture) {
      return;
    }

    winrt::check_hresult(
        dxr_->getDXDevice()->CreateRenderTargetView(
            texture.get(), nullptr, d3dRenderTargetView_.put()));

    winrt::check_hresult(
        dxr_->getD2DDeviceContext()->CreateBitmapFromDxgiSurface(
            texture.as<IDXGISurface>().get(), nullptr, d2dBitmap_.put()));

    D3D11_TEXTURE2D_DESC desc;
    texture->GetDesc(&desc);
    dimensions_ = {desc.Width, desc.Height};
  }

  PixelSize RenderTarget::getDimensions() const {
    return dimensions_;
  }

  // RenderTargetID RenderTarget::GetID() const {
  //   return iD_;
  // }

  RenderTarget::D2D RenderTarget::d2d() {
    if (!d3dTexture_) {
      IRT_LOG_SOURCE_LOCATION_AND_FATAL("Attempted to start D2D without a texture");
    }
    return {this->shared_from_this()};
  }

  RenderTarget::D3D RenderTarget::d3d() {
    if (!d3dTexture_) {
      IRT_LOG_SOURCE_LOCATION_AND_FATAL("Attempted to start D3D without a texture");
    }
    return {this->shared_from_this()};
  }


  RenderTarget::D2D::D2D(
      const std::shared_ptr<RenderTarget> &parent) : parent_(parent) {
    if (!parent) {
      IRT_BREAK;
      return;
    }
    unsafeParent_ = parent_.get();
    this->acquire();
  }

  void RenderTarget::D2D::acquire() {
    auto &mode = parent_->mode_;
    if (mode != Mode::Unattached) {
      parent_ = nullptr;
      spdlog::debug(
          "Attempted to activate D2D for a render target in mode {}", static_cast<int>(mode));
      IRT_BREAK;
      return;
    }

    mode = Mode::D2D;

    (*this)->SetTarget(unsafeParent_->d2dBitmap_.get());
    unsafeParent_->dxr_->pushD2DDraw();
    (*this)->SetTransform(D2D1::Matrix3x2F::Identity());
  }

  void RenderTarget::D2D::release() {
    if (!parent_) {
      return;
    }
    if (released_) {
      spdlog::debug("{}: double-release", __FUNCTION__);
      IRT_BREAK;
      return;
    }
    released_ = true;
    unsafeParent_->dxr_->popD2DDraw();
    unsafeParent_->dxr_->getD2DDeviceContext()->SetTarget(nullptr);

    auto &mode = parent_->mode_;
    if (mode != Mode::D2D) {
      spdlog::debug(
          "{}: attempting to release D2D, but mode is {}", __FUNCTION__, static_cast<int>(mode));
      IRT_BREAK;
      return;
    }

    mode = Mode::Unattached;
  }

  void RenderTarget::D2D::reacquire() {
    if (!released_) {
      spdlog::debug("Attempting to re-acquire without release");
      IRT_BREAK;
      return;
    }
    this->acquire();
    released_ = false;
  }

  RenderTarget::D2D::~D2D() {
    if (released_ || !parent_) {
      return;
    }
    this->release();
  }

  ID2D1DeviceContext *RenderTarget::D2D::operator->() const {
    return unsafeParent_->dxr_->getD2DDeviceContext().get();
  }

  RenderTarget::D2D::operator ID2D1DeviceContext *() const {
    return unsafeParent_->dxr_->getD2DDeviceContext().get();
  }

  RenderTarget::D3D::D3D(const std::shared_ptr<RenderTarget> &parent) : parent_(parent) {
    if (!parent) {
      IRT_BREAK;
      return;
    }
    unsafeParent_ = parent.get();

    auto &mode = parent_->mode_;
    if (mode != Mode::Unattached) {
      parent_ = nullptr;
      spdlog::debug(
          "Attempted to activate D3D for a render target in mode {}", static_cast<int>(mode));
      IRT_BREAK;
      return;
    }
    mode = Mode::D3D;
  }

  RenderTarget::D3D::~D3D() {
    if (!parent_) {
      return;
    }

    auto &mode = parent_->mode_;
    if (mode != Mode::D3D) {
      spdlog::debug(
          "Attempting to leave D3D for render target in mode {}", static_cast<int>(mode));
      IRT_BREAK;
      return;
    }
    mode = Mode::Unattached;
  }

  ID3D11Texture2D *RenderTarget::D3D::texture() const {
    return unsafeParent_->d3dTexture_.get();
  }

  ID3D11RenderTargetView *RenderTarget::D3D::rtv() const {
    return unsafeParent_->d3dRenderTargetView_.get();
  }

}// namespace OpenKneeboard