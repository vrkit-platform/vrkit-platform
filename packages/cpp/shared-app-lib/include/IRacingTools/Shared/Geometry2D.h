// Copied from OpenKneeboard
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

#include <array>
#include <cmath>
#include <compare>

#include <d2d1.h>
#include <d3d11.h>
//
//#ifdef OPENKNEEBOARD_JSON_SERIALIZE
// #include <OpenKneeboard/json.h>
//#endif

namespace IRacingTools::Shared::Geometry2D {

 enum class ScaleToFitMode {
   ShrinkOrGrow,
   GrowOnly,
   ShrinkOnly,
 };

 template <class T>
 struct Size {
   T width {};
   T height {};

   constexpr operator bool() const noexcept {
     return width >= 1 && height >= 1;
   }

   constexpr Size<T> operator/(const T divisor) const noexcept {
     return {width / divisor, height / divisor};
   }

   constexpr Size<T> operator*(const std::integral auto operand) const noexcept {
     return {width * operand, height * operand};
   }

   constexpr Size<T> operator*(
       const std::floating_point auto operand) const noexcept
     requires std::floating_point<T>
   {
     return {width * operand, height * operand};
   }

   constexpr auto operator<=>(const Size<T>&) const noexcept = default;

   constexpr Size() {
   }

   constexpr Size(T width, T height) : width(width), height(height) {
   }

   template <class TV = T>
   constexpr auto Width() const noexcept {
     return static_cast<TV>(width);
   }

   template <class TV = T>
   constexpr auto Height() const noexcept {
     return static_cast<TV>(height);
   }

   constexpr Size<T> ScaledToFit(const Size<T>& container,
                                 ScaleToFitMode mode = ScaleToFitMode::ShrinkOrGrow) const noexcept {
     const auto scaleX = static_cast<float>(container.width) / width;
     const auto scaleY = static_cast<float>(container.height) / height;
     const auto scale = std::min<float>(scaleX, scaleY);

     if (scale > 1 && mode == ScaleToFitMode::ShrinkOnly) {
       return *this;
     }

     if (scale < 1 && mode == ScaleToFitMode::GrowOnly) {
       return *this;
     }

     const Size<float> scaled {
         width * scale,
         height * scale,
     };
     if constexpr (std::integral<T>) {
       return scaled.Rounded<T>();
     } else {
       return scaled;
     }
   }

   constexpr Size<T> IntegerScaledToFit(
       const Size<T>& container,
       ScaleToFitMode mode = ScaleToFitMode::ShrinkOrGrow) const noexcept {
     const auto scaleX = static_cast<float>(container.width) / width;
     const auto scaleY = static_cast<float>(container.height) / height;
     const auto scale = std::min<float>(scaleX, scaleY);

     if (scale > 1) {
       if (mode == ScaleToFitMode::ShrinkOnly) {
         return *this;
       }
       const auto mult = static_cast<uint32_t>(std::floor(scale));
       return {
           width * mult,
           height * mult,
       };
     }

     if (mode == ScaleToFitMode::GrowOnly) {
       return *this;
     }

     const auto divisor = static_cast<uint32_t>(std::ceil(1 / scale));
     return {
         width / divisor,
         height / divisor,
     };
   }

   template <class TValue, class TSize = Size<TValue>>
     requires(std::integral<T> || std::floating_point<TValue>)
   constexpr TSize StaticCast() const noexcept {
     return TSize {
         Width<TValue>(),
         Height<TValue>(),
     };
   }

   template <std::integral TValue, class TSize = Size<TValue>>
   constexpr TSize Floor() const noexcept {
     return TSize {
         static_cast<TValue>(std::floor(width)),
         static_cast<TValue>(std::floor(height)),
     };
   }

   template <class TValue, class TSize = Size<TValue>>
     requires std::floating_point<T>
   constexpr TSize Rounded() const noexcept {
     return {
         static_cast<TValue>(std::lround(width)),
         static_cast<TValue>(std::lround(height)),
     };
   }

   constexpr operator D2D1_SIZE_U() const
     requires std::integral<T>
   {
     return StaticCast<UINT32, D2D1_SIZE_U>();
   }

   constexpr operator D2D1_SIZE_F() const {
     return StaticCast<FLOAT, D2D1_SIZE_F>();
   }
 };

 template <class T>
 struct Point {
   T x {};
   T y {};

   template <class TV = T>
   constexpr auto X() const {
     return static_cast<TV>(x);
   }

   template <class TV = T>
   constexpr auto Y() const {
     return static_cast<TV>(y);
   }

   constexpr Point<T> operator/(const T divisor) const noexcept {
     return {x / divisor, y / divisor};
   }

   constexpr Point<T> operator*(const T operand) const noexcept {
     return {x * operand, y * operand};
   }

   constexpr Point<T>& operator+=(const Point<T>& operand) noexcept {
     x += operand.x;
     y += operand.y;
     return *this;
   }

   friend constexpr Point<T> operator+(
       Point<T> lhs,
       const Point<T>& rhs) noexcept {
     lhs += rhs;
     return lhs;
   }

   constexpr auto operator<=>(const Point<T>&) const noexcept = default;

   template <class TValue, class TPoint = Point<TValue>>
   constexpr TPoint StaticCast() const noexcept {
     return TPoint {
         static_cast<TValue>(x),
         static_cast<TValue>(y),
     };
   }

   template <class TValue, class TPoint = Point<TValue>>
     requires std::floating_point<T>
   constexpr TPoint Rounded() const noexcept {
     return {
         static_cast<TValue>(std::lround(x)),
         static_cast<TValue>(std::lround(y)),
     };
   }

   constexpr operator D2D1_POINT_2F() const noexcept {
     return StaticCast<FLOAT, D2D1_POINT_2F>();
   }

   constexpr operator D2D1_POINT_2U() const noexcept
     requires std::integral<T>
   {
     return StaticCast<UINT32, D2D1_POINT_2U>();
   }
 };

 template <class T>
 struct Rect {
   enum class Origin {
     TopLeft,
     BottomLeft,
   };

   Point<T> offset {};
   Size<T> size {};

   Origin origin {Origin::TopLeft};

   constexpr operator bool() const noexcept {
     return size;
   }

   constexpr Rect<T> operator/(const T divisor) const noexcept {
     return {
         offset / divisor,
         size / divisor,
     };
   }

   template <std::integral TValue>
   constexpr Rect<T> operator*(const TValue operand) const noexcept {
     return {
         offset * operand,
         size * operand,
     };
   }

   template <std::floating_point TValue>
     requires std::floating_point<T>
   constexpr Rect<T> operator*(const TValue operand) const noexcept {
     return {
         offset * operand,
         size * operand,
     };
   }

   template <class TV = T>
   constexpr auto Left() const {
     return offset.X<TV>();
   }

   template <class TV = T>
   constexpr auto Top() const {
     return offset.Y<TV>();
   }

   template <class TV = T>
   constexpr auto Right() const {
     return Left<TV>() + size.width;
   }

   template <class TV = T>
   constexpr auto Bottom() const {
     if (origin == Origin::TopLeft) {
       return Top<TV>() + size.height;
     }
     return Top<TV>() - size.height;
   }

   constexpr Point<T> TopLeft() const {
     return offset;
   }

   constexpr Point<T> BottomRight() const {
     return {Right(), Bottom()};
   }

   template <class TV = T>
   constexpr auto Width() const noexcept {
     return size.Width<TV>();
   }

   template <class TV = T>
   constexpr auto Height() const noexcept {
     return size.Height<TV>();
   }

   constexpr Rect<T> WithOrigin(Origin origin, const Size<T>& container) const {
     if (origin == origin) {
       return *this;
     }
     return {
         {offset.x, container.height - offset.y},
         size,
         origin,
     };
   }

   constexpr auto operator<=>(const Rect<T>&) const noexcept = default;

   template <class TValue, class TRect = Rect<TValue>>
   constexpr TRect StaticCast() const noexcept {
     return {
         {
             static_cast<TValue>(offset.x),
             static_cast<TValue>(offset.y),
         },
         {
             static_cast<TValue>(size.width),
             static_cast<TValue>(size.height),
         },
     };
   }

   template <class TValue, class TRect>
   constexpr TRect StaticCastWithBottomRight() const noexcept {
     return {
         static_cast<TValue>(offset.x),
         static_cast<TValue>(offset.y),
         static_cast<TValue>(offset.x + size.width),
         static_cast<TValue>(offset.y + size.height),
     };
   }

   template <class TValue>
     requires std::floating_point<T>
   constexpr Rect<TValue> Rounded() const noexcept {
     return {offset.Rounded<TValue>(), size.Rounded<TValue>()};
   }

   constexpr operator D3D11_RECT() const
     requires std::integral<T>
   {
     return StaticCastWithBottomRight<LONG, D3D11_RECT>();
   }

   constexpr operator D2D_RECT_U() const
     requires std::integral<T>
   {
     return StaticCastWithBottomRight<UINT32, D2D_RECT_U>();
   }

   constexpr operator D2D1_RECT_F() const {
     return StaticCastWithBottomRight<FLOAT, D2D1_RECT_F>();
   }
 };

 using PixelSize = Geometry2D::Size<uint32_t>;
 using PixelPoint = Geometry2D::Point<uint32_t>;
 using PixelRect = Geometry2D::Rect<uint32_t>;

//
// template <class T>
// void from_json(const nlohmann::json& j, Size<T>& v) {
//   v.width = j.at("Width");
//   v.height = j.at("Height");
// }
// template <class T>
// void to_json(nlohmann::json& j, const Size<T>& v) {
//   j["Width"] = v.width;
//   j["Height"] = v.height;
// }
//

}// namespace OpenKneeboard::Geometry2D