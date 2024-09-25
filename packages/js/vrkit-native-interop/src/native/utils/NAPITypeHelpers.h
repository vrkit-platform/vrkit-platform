// ReSharper disable once CppParameterMayBeConstPtrOrRef
#pragma once

#include <napi.h>
#include <IRacingTools/Shared/VRTypes.h>
#include <IRacingTools/Shared/Logging/LoggingManager.h>


namespace IRacingTools::App::Node::Utils {
  using namespace Napi;
  using namespace IRacingTools::Shared;

  template<typename T>
    auto NumberToNative(Napi::Env& env, const Napi::Number& n, T defaultValue) -> T {
    if constexpr (std::is_same_v<T, double>) {
      return n.DoubleValue();
    }
    if constexpr (std::is_same_v<T, float>) {
      return n.FloatValue();
    }
    if constexpr (std::is_same_v<T, int32_t>) {
      return n.Int32Value();
    }
    if constexpr (std::is_same_v<T, uint32_t>) {
      return n.Uint32Value();
    }
    if constexpr (std::is_same_v<T, int64_t>) {
      return n.Int64Value();
    }
    return defaultValue;



  }

  template<typename T>
  T PropertyNumberToNative(Napi::Env& env, const Napi::Object& o, const std::string& propertyName, T defaultValue) {
    return o.Has(propertyName) ? NumberToNative<T>(env, o.Get(propertyName).As<Napi::Number>(), defaultValue) : defaultValue;
  }

  template<typename T>
    Shared::Size<T> SizeObjectToNative(Napi::Env& env, const Napi::Object& sizeObj) {
    static_assert(std::is_same_v<T,float> || std::is_same_v<T,uint32_t>|| std::is_same_v<T,int32_t>);
    return Shared::Size<T>{
      PropertyNumberToNative<T>(env, sizeObj, "width",0),
      PropertyNumberToNative<T>(env, sizeObj, "height",0),
    };

  }

  template<typename T>
  Shared::Rect<T> RectObjectToNative(Napi::Env& env, const Napi::Object& o) {
    static_assert(std::is_same_v<T,float> || std::is_same_v<T,uint32_t>|| std::is_same_v<T,int32_t>);
    auto posObj = o.Get("position").As<Napi::Object>();
    Shared::Point<T> offset{
      PropertyNumberToNative<T>(env, posObj, "x",0),
      PropertyNumberToNative<T>(env, posObj, "y",0),
    };
    auto sizeObj = o.Get("size").As<Napi::Object>();
    Shared::Size<T> size{
      PropertyNumberToNative<T>(env, sizeObj, "width",0),
      PropertyNumberToNative<T>(env, sizeObj, "height",0),
    };
    return Shared::Rect<T>{offset, size};
  }


  Shared::VR::VRNativeLayout VRLayoutObjectToNative(Napi::Env& env, const Napi::Object& o);
}
