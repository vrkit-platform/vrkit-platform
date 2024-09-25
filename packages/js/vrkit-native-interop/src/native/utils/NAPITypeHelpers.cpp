// ReSharper disable once CppParameterMayBeConstPtrOrRef


#include <napi.h>

#include "NAPITypeHelpers.h"

using namespace IRacingTools::App::Node;
using namespace IRacingTools::Shared;
using namespace Napi;


namespace IRacingTools::App::Node::Utils {
  VR::VRNativeLayout VRLayoutObjectToNative(Napi::Env& env, const Napi::Object& o) {
    auto poseObj = o.Get("pose").As<Napi::Object>();
    VR::VRNativePose pose{
      PropertyNumberToNative<float>(env, poseObj, "x",0),
      PropertyNumberToNative<float>(env, poseObj, "eyeY",0),
      PropertyNumberToNative<float>(env, poseObj, "z",0),
    };
    auto sizeObj = o.Get("size").As<Napi::Object>();
    VRSize size{
      PropertyNumberToNative<float>(env, sizeObj, "width",0),
      PropertyNumberToNative<float>(env, sizeObj, "height",0),
    };
    return VR::VRNativeLayout{pose, size};
  }
}