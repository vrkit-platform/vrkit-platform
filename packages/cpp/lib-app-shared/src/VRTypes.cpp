
#include <VRKit/Shared/VRTypes.h>

namespace VRKit::Shared::VR {

  VRNativePose VRNativePose::getHorizontalMirror() const {
    auto ret = *this;
    ret.x = -ret.x;
    // Yaw
    ret.rY = -ret.rY;
    // Roll
    ret.rZ = -ret.rZ;
    return ret;
  }
}