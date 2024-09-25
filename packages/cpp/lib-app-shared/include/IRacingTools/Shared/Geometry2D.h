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

#include "SharedAppLibPCH.h"
#include <IRacingTools/Models/TrackMap.pb.h>
#include <IRacingTools/SDK/ErrorTypes.h>
#include <array>
#include <cmath>
#include <compare>


#include <nlohmann/json.hpp>
#include <nlohmann/json_fwd.hpp>


namespace IRacingTools::Shared {

  enum class ScaleToFitMode {
    ShrinkOrGrow,
    GrowOnly,
    ShrinkOnly,
  };

  template<class T>
  struct Size {
    T width_{};
    T height_{};

    constexpr T width() const noexcept {
      return width_;
    }

    constexpr T height() const noexcept {
      return height_;
    }

    constexpr operator bool() const noexcept {
      return width_ >= 1 && height_ >= 1;
    }

    constexpr Size<T> operator/(const T divisor) const noexcept {
      return {width_ / divisor, height_ / divisor};
    }

    constexpr Size<T>
    operator*(const std::integral auto operand) const noexcept {
      return {width_ * operand, height_ * operand};
    }

    constexpr Size<T>
    operator*(const std::floating_point auto operand) const noexcept
      requires std::floating_point<T>
    {
      return {width_ * operand, height_ * operand};
    }

    constexpr auto operator<=>(const Size<T> &) const noexcept = default;

    constexpr Size(
        const T &width = static_cast<T>(0), const T &height = static_cast<T>(0))
        : width_(width), height_(height) {
    }

    template<class TV = T>
    constexpr auto width() const noexcept {
      return static_cast<TV>(width_);
    }

    template<class TV = T>
    constexpr auto height() const noexcept {
      return static_cast<TV>(height_);
    }

    constexpr Size<T> scaledToFit(
        const Size<T> &container,
        ScaleToFitMode mode = ScaleToFitMode::ShrinkOrGrow) const noexcept {
      const auto scaleX = static_cast<float>(container.width_) / width_;
      const auto scaleY = static_cast<float>(container.height_) / height_;
      const auto scale = std::min<float>(scaleX, scaleY);

      if (scale > 1 && mode == ScaleToFitMode::ShrinkOnly) {
        return *this;
      }

      if (scale < 1 && mode == ScaleToFitMode::GrowOnly) {
        return *this;
      }

      const Size<float> scaled{
          width_ * scale,
          height_ * scale,
      };
      if constexpr (std::integral<T>) {
        return scaled.rounded<T>();
      } else {
        return scaled;
      }
    }

    constexpr Size<T> integerScaledToFit(
        const Size<T> &container,
        ScaleToFitMode mode = ScaleToFitMode::ShrinkOrGrow) const noexcept {
      const auto scaleX = static_cast<float>(container.width_) / width_;
      const auto scaleY = static_cast<float>(container.height_) / height_;
      const auto scale = std::min<float>(scaleX, scaleY);

      if (scale > 1) {
        if (mode == ScaleToFitMode::ShrinkOnly) {
          return *this;
        }
        const auto mult = static_cast<uint32_t>(std::floor(scale));
        return {
            width_ * mult,
            height_ * mult,
        };
      }

      if (mode == ScaleToFitMode::GrowOnly) {
        return *this;
      }

      const auto divisor = static_cast<uint32_t>(std::ceil(1 / scale));
      return {
          width_ / divisor,
          height_ / divisor,
      };
    }

    template<class TValue, class TSize = Size<TValue>>
      requires(std::integral<T> || std::floating_point<TValue>)
    constexpr TSize staticCast() const noexcept {
      return TSize{
          width<TValue>(),
          height<TValue>(),
      };
    }

    template<std::integral TValue, class TSize = Size<TValue>>
    constexpr TSize floor() const noexcept {
      return TSize{
          static_cast<TValue>(std::floor(width_)),
          static_cast<TValue>(std::floor(height_)),
      };
    }

    template<class TValue, class TSize = Size<TValue>>
      requires std::floating_point<T>
    constexpr TSize rounded() const noexcept {
      return {
          static_cast<TValue>(std::lround(width_)),
          static_cast<TValue>(std::lround(height_)),
      };
    }

    explicit operator std::string() const {
      return to_json(this);
    }

    std::string toString() const {
      nlohmann::json j;
      j["width"] = width_;
      j["height"] = height_;
      return j.dump();
    }

    explicit constexpr operator D2D1_SIZE_U() const
      requires std::integral<T>
    {
      return staticCast<UINT32, D2D1_SIZE_U>();
    }

    constexpr operator D2D1_SIZE_F() const {
      return staticCast<FLOAT, D2D1_SIZE_F>();
    }
  };

  template<class T>
  struct Point {
    T x_{};
    T y_{};

    template<class TV = T>
    constexpr auto x() const {
      return static_cast<TV>(x_);
    }

    template<class TV = T>
    constexpr auto y() const {
      return static_cast<TV>(y_);
    }

    constexpr Point<T> operator/(const T divisor) const noexcept {
      return {x_ / divisor, y_ / divisor};
    }

    constexpr Point<T> operator*(const T operand) const noexcept {
      return {x_ * operand, y_ * operand};
    }

    constexpr Point<T> &operator+=(const Point<T> &operand) noexcept {
      x_ += operand.x_;
      y_ += operand.y_;
      return *this;
    }

    friend constexpr Point<T>
    operator+(Point<T> lhs, const Point<T> &rhs) noexcept {
      lhs += rhs;
      return lhs;
    }

    constexpr auto operator<=>(const Point<T> &) const noexcept = default;

    template<class TValue, class TPoint = Point<TValue>>
    constexpr TPoint staticCast() const noexcept {
      return TPoint{
          static_cast<TValue>(x_),
          static_cast<TValue>(y_),
      };
    }

    template<class TValue, class TPoint = Point<TValue>>
      requires std::floating_point<T>
    constexpr TPoint rounded() const noexcept {
      return {
          static_cast<TValue>(std::lround(x_)),
          static_cast<TValue>(std::lround(y_)),
      };
    }

    constexpr operator D2D1_POINT_2F() const noexcept {
      return staticCast<FLOAT, D2D1_POINT_2F>();
    }

    constexpr operator D2D1_POINT_2U() const noexcept
      requires std::integral<T>
    {
      return staticCast<UINT32, D2D1_POINT_2U>();
    }
  };

  template<class T>
  struct Rect {
    enum class Origin {
      TopLeft,
      BottomLeft,
    };

    Point<T> offset_{};
    Size<T> size_{};

    Origin origin_{Origin::TopLeft};

    constexpr operator bool() const noexcept {
      return size_;
    }

    constexpr Rect<T> operator/(const T divisor) const noexcept {
      return {
          offset_ / divisor,
          size_ / divisor,
      };
    }

    template<std::integral TValue>
    constexpr Rect<T> operator*(const TValue operand) const noexcept {
      return {
          offset_ * operand,
          size_ * operand,
      };
    }

    template<std::floating_point TValue>
      requires std::floating_point<T>
    constexpr Rect<T> operator*(const TValue operand) const noexcept {
      return {
          offset_ * operand,
          size_ * operand,
      };
    }

    template<class TV = T>
    constexpr auto left() const {
      return offset_.template x<TV>();
    }

    template<class TV = T>
    constexpr auto top() const {
      return offset_.template y<TV>();
    }

    template<class TV = T>
    constexpr auto right() const {
      return left<TV>() + size_.width_;
    }

    template<class TV = T>
    constexpr auto bottom() const {
      if (origin_ == Origin::TopLeft) {
        return top<TV>() + size_.height_;
      }
      return top<TV>() - size_.height_;
    }

    constexpr Origin origin() const {
      return origin_;
    }

    constexpr Point<T> offset() const {
      return offset_;
    }

    constexpr Size<T> size() const {
      return size_;
    }

    constexpr Point<T> topLeft() const {
      return offset_;
    }

    constexpr Point<T> bottomRight() const {
      return {right(), bottom()};
    }

    template<class TV = T>
    constexpr auto width() const noexcept {
      return size_.template Width<TV>();
    }

    template<class TV = T>
    constexpr auto height() const noexcept {
      return size_.template Height<TV>();
    }

    constexpr Rect<T>
    withOrigin(Origin otherOrigin, const Size<T> &container) const {
      if (origin_ == otherOrigin) {
        return *this;
      }
      return {
          {offset_.x_, container.height_ - offset_.y_},
          size_,
          origin_,
      };
    }

    constexpr auto operator<=>(const Rect<T> &) const noexcept = default;

    template<class TValue, class TRect = Rect<TValue>>
    constexpr TRect staticCast() const noexcept {
      return {
          {
              static_cast<TValue>(offset_.x_),
              static_cast<TValue>(offset_.y_),
          },
          {
              static_cast<TValue>(size_.width_),
              static_cast<TValue>(size_.height_),
          },
      };
    }

    template<class TValue, class TRect>
    constexpr TRect staticCastWithBottomRight() const noexcept {
      return {
          static_cast<TValue>(offset_.x_),
          static_cast<TValue>(offset_.y_),
          static_cast<TValue>(offset_.x_ + size_.width_),
          static_cast<TValue>(offset_.y_ + size_.height_),
      };
    }

    template<class TValue>
      requires std::floating_point<T>
    constexpr Rect<TValue> rounded() const noexcept {
      return {
          offset_.template rounded<TValue>(), size_.template rounded<TValue>()};
    }

    constexpr operator D3D11_RECT() const
      requires std::integral<T>
    {
      return staticCastWithBottomRight<LONG, D3D11_RECT>();
    }

    constexpr operator D2D_RECT_U() const
      requires std::integral<T>
    {
      return staticCastWithBottomRight<UINT32, D2D_RECT_U>();
    }

    constexpr operator D2D1_RECT_F() const {
      return staticCastWithBottomRight<FLOAT, D2D1_RECT_F>();
    }
  };

  /**
   * NOTE: C++26 allows this to be a `constexpr`
   *
   * @tparam T type of scalar to use
   * @param p1 point 1
   * @param p2 point 2
   * @return distance between points
   */
  template<typename T>
  T DistanceBetween(
      const Models::LapCoordinate &p1,
      const Models::LapCoordinate &p2) {
    return std::sqrt(
        std::pow(p2.x() - p1.x(), 2) + std::pow(p2.y() - p1.y(), 2));
  }

  template<typename T>
  constexpr std::expected<T, SDK::NotFoundError>
  Closest(const std::vector<T> &vec, T value) {
    auto const it = std::lower_bound(vec.begin(), vec.end(), value);
    if (it == vec.end()) {
      return SDK::MakeUnexpected<SDK::NotFoundError>(
          "Unable to find lower bound for value ({})", value);
    }

    return *it;
  }

  template<typename K, typename V>
  constexpr std::expected<K, SDK::NotFoundError>
  ClosestKey(const std::map<K, V> &map, K value) {
    auto const it = std::lower_bound(
        map.begin(),
        map.end(),
        value,
        [](const std::pair<K, V> &entry, K currentValue) {
          return entry.first < currentValue;
        });
    if (it == map.end()) {
      return SDK::MakeUnexpected<SDK::NotFoundError>(
          "Unable to find lower bound for value ({})", value);
    }

    return (*it).first;
  }

  template<typename K, typename V>
  constexpr std::expected<V, SDK::NotFoundError>
  ClosestValue(const std::map<K, V> &map, K value) {
    auto const it = std::lower_bound(
        map.begin(),
        map.end(),
        value,
        [](const std::pair<K, V> &entry, K currentValue) {
          return entry.first < currentValue;
        });
    if (it == map.end()) {
      return SDK::MakeUnexpected<SDK::NotFoundError>(
          "Unable to find lower bound for value ({})", value);
    }

    return (*it).second;
  }

  using PixelSize = Size<uint32_t>;
  using PixelPoint [[maybe_unused]] = Point<uint32_t>;
  using PixelRect = Rect<uint32_t>;
  using ScreenRect = Rect<int32_t>;
  using VRSize = Size<float>;
  using VRPoint = Point<float>;
  using VRRect = Rect<float>;

  template<typename T>
  bool IsNonZeroSize(Size<T> size) {
    return size.width() > T(0) && size.height() > T(0);
  }

  template<class T>
  void from_json(const nlohmann::json &j, Size<T> &v) {
    v.width_ = j.at("width");
    v.height_ = j.at("height");
  }

  template<class T>
  void to_json(nlohmann::json &j, const Size<T> &v) {
    j["width"] = v.width_;
    j["height"] = v.height_;
  }



} // namespace IRacingTools::Shared