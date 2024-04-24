
#include <IRacingTools/Shared/VRTypes.h>

namespace IRacingTools::Shared::VR {

  VRPose VRPose::getHorizontalMirror() const {
    auto ret = *this;
    ret.x = -ret.x;
    // Yaw
    ret.rY = -ret.rY;
    // Roll
    ret.rZ = -ret.rZ;
    return ret;
  }
}