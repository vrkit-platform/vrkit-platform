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
#pragma once

#include <IRacingTools/Shared/Graphics/DX113D.h>

#include "../SharedAppLibPCH.h"

#include <IRacingTools/Shared/Graphics/Types.h>
#include <IRacingTools/Shared/SHM/SHMDX11.h>

#include "ViewerWindowRenderer.h"

namespace IRacingTools::Shared::UI {

class ViewerWindowD3D11Renderer final : public Renderer {
 public:
  ViewerWindowD3D11Renderer() = delete;

  explicit ViewerWindowD3D11Renderer(const winrt::com_ptr<ID3D11Device>&);
  virtual ~ViewerWindowD3D11Renderer();
  virtual std::wstring_view getName() const noexcept override;

  virtual SHM::SHMCachedReader* getSHM() override;

  virtual void initialize(uint8_t swapchainLength) override;

  virtual void saveTextureToFile(
    SHM::IPCClientTexture*,
    const std::filesystem::path&) override;

  virtual uint64_t render(
    SHM::IPCClientTexture* sourceTexture,
    const PixelRect& sourceRect,
    HANDLE destTexture,
    const PixelSize& destTextureDimensions,
    const PixelRect& destRect,
    HANDLE fence,
    uint64_t fenceValueIn) override;

 private:
  SHM::DX11::SHMDX11CachedReader cachedReader_ {SHM::ConsumerKind::Viewer};

  uint64_t sessionId_ {};

  winrt::com_ptr<ID3D11Device1> d3dDevice_;
  winrt::com_ptr<ID3D11DeviceContext> d3dDeviceContext_;

  std::unique_ptr<Graphics::SpriteBatch> spriteBatch_;

  PixelSize destDimensions_;
  HANDLE destHandle_ {};
  winrt::com_ptr<ID3D11Texture2D> destTexture_;
  winrt::com_ptr<ID3D11RenderTargetView> destRenderTargetView_;
};

}// namespace OpenKneeboard::Viewer