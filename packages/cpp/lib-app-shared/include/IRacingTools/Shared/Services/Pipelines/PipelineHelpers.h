#pragma once


#include <IRacingTools/Shared/SharedAppLibPCH.h>
#include <magic_enum.hpp>

#include <IRacingTools/Models/Pipeline.pb.h>

#include <IRacingTools/SDK/Utils/LUT.h>
#include <IRacingTools/SDK/Utils/Singleton.h>
#include <IRacingTools/SDK/Utils/TupleHelpers.h>

#include <IRacingTools/Shared/ProtoHelpers.h>
#include <IRacingTools/Shared/Logging/LoggingManager.h>
#include <IRacingTools/Shared/Services/ServiceContainer.h>

namespace IRacingTools::Shared::Services::Pipelines {
  using namespace Logging;
  using namespace Models;
  using namespace SDK::Utils;


}// namespace IRacingTools::Shared::Services
