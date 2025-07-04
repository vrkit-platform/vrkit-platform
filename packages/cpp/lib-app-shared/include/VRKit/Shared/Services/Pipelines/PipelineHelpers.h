#pragma once


#include <VRKit/Shared/SharedAppLibPCH.h>
#include <magic_enum/magic_enum.hpp>

#include <VRKit/Models/Pipeline.pb.h>

#include <IRacingSDK/Utils/LUT.h>
#include <IRacingSDK/Utils/Singleton.h>
#include <IRacingSDK/Utils/TupleHelpers.h>

#include <VRKit/Shared/ProtoHelpers.h>
#include <VRKit/Shared/Logging/LoggingManager.h>
#include <VRKit/Shared/Services/ServiceContainer.h>

namespace VRKit::Shared::Services::Pipelines {
  using namespace Logging;
  using namespace Models;
  using namespace IRacingSDK::Utils;


}// namespace VRKit::Shared::Services
