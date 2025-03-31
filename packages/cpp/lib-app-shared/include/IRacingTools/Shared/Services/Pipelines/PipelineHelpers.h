#pragma once


#include <IRacingTools/Shared/SharedAppLibPCH.h>
#include <magic_enum/magic_enum.hpp>

#include <IRacingTools/Models/Pipeline.pb.h>

#include <IRacingSDK/Utils/LUT.h>
#include <IRacingSDK/Utils/Singleton.h>
#include <IRacingSDK/Utils/TupleHelpers.h>

#include <IRacingTools/Shared/ProtoHelpers.h>
#include <IRacingTools/Shared/Logging/LoggingManager.h>
#include <IRacingTools/Shared/Services/ServiceContainer.h>

namespace IRacingTools::Shared::Services::Pipelines {
  using namespace Logging;
  using namespace Models;
  using namespace IRacingSDK::Utils;


}// namespace IRacingTools::Shared::Services
