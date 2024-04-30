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

#include "../SharedAppLibPCH.h"

#include "DXResources.h"
#include "../Geometry2D.h"
// #include <OpenKneeboard/RenderTargetID.h>

// #include <OpenKneeboard/audited_ptr.h>
// #include <OpenKneeboard/dprint.h>
// #include <OpenKneeboard/tracing.h>

#include <memory>

namespace IRacingTools::Shared::Graphics {

struct DXResources;

/** Encapsulate a render target for use with either D3D11 or D2D.
 *
 * Only D2D or D3D can be active, and if acquired, the objects
 * must be released before passing the RenderTarget* on, or the
 * callee will not be able to use it.
 */
class RenderTarget : public std::enable_shared_from_this<RenderTarget> {
 public:
  RenderTarget() = delete;
  ~RenderTarget();

  static std::shared_ptr<RenderTarget> Create(
    const std::shared_ptr<DXResources>& dxr,
    const winrt::com_ptr<ID3D11Texture2D>& texture);

  static std::shared_ptr<RenderTarget> Create(
    const std::shared_ptr<DXResources>& dxr,
    nullptr_t texture);


  PixelSize getDimensions() const;
  //virtual RenderTargetID GetID() const;

  void setD3DTexture(const winrt::com_ptr<ID3D11Texture2D>&);

  class D2D;
  class D3D;
  friend class D2D;
  friend class D3D;

  D2D d2d();
  D3D d3d();

 protected:
  RenderTarget(
    const std::shared_ptr<DXResources>& dxr,
    const winrt::com_ptr<ID3D11Texture2D>& texture);

 private:
  enum class Mode { Unattached, D2D, D3D };
  Mode mode_ {Mode::Unattached};

  PixelSize dimensions_;

  std::shared_ptr<DXResources> dxr_;

  // RenderTargetID iD_;

  winrt::com_ptr<ID2D1Bitmap1> d2dBitmap_;

  winrt::com_ptr<ID3D11Texture2D> d3dTexture_;
  winrt::com_ptr<ID3D11RenderTargetView> d3dRenderTargetView_;
};

/** RenderTarget with multiple identities for cache management purposes.
 *
 * For example, the interprocess render uses a single canvas, so a single render
 * target; however, RTID is used for cache indexing, so every active view should
 * have a distinct ID.
 *
 * This effectively allows multiple RTIDs to share a single set of D3D
 * resources.
 */
// class RenderTargetWithMultipleIdentities : public RenderTarget {
//  public:
//   static std::shared_ptr<RenderTargetWithMultipleIdentities> Create(
//     const std::shared_ptr<DXResources>& dxr,
//     const winrt::com_ptr<ID3D11Texture2D>& texture,
//     size_t identityCount);
//
//   // virtual RenderTargetID GetID() const override;
//   // void SetActiveIdentity(size_t index);
//
//  protected:
//   using RenderTarget::RenderTarget;
//
//  private:
//   std::vector<RenderTargetID> identities_;
//   size_t currentIdentity_ {0};
// };

class RenderTarget::D2D final {
 public:
  D2D() = delete;
  D2D(const D2D&) = delete;
  D2D(D2D&&) = delete;
  D2D& operator=(const D2D&) = delete;
  D2D& operator=(D2D&&) = delete;

  D2D(const std::shared_ptr<RenderTarget>&);
  ~D2D();

  ID2D1DeviceContext* operator->() const;
  operator ID2D1DeviceContext*() const;

  void release();
  void reacquire();

 private:
  std::shared_ptr<RenderTarget> parent_;
  
  RenderTarget* unsafeParent_ {nullptr};
  bool released_ {false};
  bool hdr_ {false};

  void acquire();
  
};

class RenderTarget::D3D final {
 public:
  D3D() = delete;
  D3D(const D3D&) = delete;
  D3D(D3D&&) = delete;
  D3D& operator=(const D3D&) = delete;
  D3D& operator=(D3D&&) = delete;

  D3D(const std::shared_ptr<RenderTarget>&);
  ~D3D();

  ID3D11Texture2D* texture() const;
  ID3D11RenderTargetView* rtv() const;

 private:
  std::shared_ptr<RenderTarget> parent_;
  RenderTarget* unsafeParent_ {nullptr};
};

}// namespace OpenKneeboard