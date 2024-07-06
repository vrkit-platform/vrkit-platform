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

#include <memory>

#include "../SharedAppLibPCH.h"

#include <directxtk/SpriteBatch.h>

#include "../Geometry2D.h"
#include "DX3D.h"


namespace IRacingTools::Shared::Graphics {


class SavedState final {
 public:
  SavedState(const winrt::com_ptr<ID3D11DeviceContext>&);
  SavedState(ID3D11DeviceContext*);
  ~SavedState();

  SavedState() = delete;
  SavedState(const SavedState&) = delete;
  SavedState(SavedState&&) = delete;
  SavedState& operator=(const SavedState&) = delete;
  SavedState& operator=(SavedState&&) = delete;

 private:
  struct Impl;
  Impl* impl_ {nullptr};
};



/** Wrapper around DirectXTK SpriteBatch which sets the required state on the
 * device first.
 *
 * Handy instead of DirectXTK as all current OpenKneeboard clients either:
 * - pretty much use Direct2D with this being the only D3D, so set the state up
 * just for this
 * - hook into an exisiting render pipeline so can't make assumptions about the
 * device state. These should probably also use the `SavedState` class above.
 *
 * I've also added a helper for `Clear()` which is pretty basic
 * for D3D11, but more involved for other APIs like D3D12; included here for
 * consistency.
 */
class SpriteBatch {
 public:
  SpriteBatch() = delete;
  explicit SpriteBatch(ID3D11Device*);
  ~SpriteBatch();

  void begin(
    ID3D11RenderTargetView*,
    const PixelSize& rtvSize,
    std::function<void __cdecl()> setCustomShaders = nullptr);
  void clear(DirectX::XMVECTORF32 color = DirectX::Colors::Transparent);
  void draw(
    ID3D11ShaderResourceView* source,
    const PixelRect& sourceRect,
    const PixelRect& destRect,
    DirectX::XMVECTORF32 tint = DirectX::Colors::White);
  void end();

 private:
  winrt::com_ptr<ID3D11Device> device_;
  winrt::com_ptr<ID3D11DeviceContext> deviceContext_;

  std::unique_ptr<DirectX::DX11::SpriteBatch> dxtkSpriteBatch_;

  ID3D11RenderTargetView* target_ {nullptr};
};

}// namespace OpenKneeboard::D3D11
