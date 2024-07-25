#pragma once

#include <IRacingTools/Shared/SharedAppLibPCH.h>

#include <condition_variable>
#include <expected>
#include <memory>
#include <type_traits>

// #include <boost/sml2>

#include <IRacingTools/SDK/ErrorTypes.h>
#include <IRacingTools/Shared/Logging/LoggingManager.h>
#include <IRacingTools/Shared/ProtoHelpers.h>
#include <IRacingTools/Shared/Services/Service.h>
#include <IRacingTools/Shared/Services/ServiceManager.h>
#include <IRacingTools/Shared/Services/TelemetryDataService.h>
#include <IRacingTools/Shared/Services/TrackMapService.h>


namespace IRacingTools::Shared::Services {
  namespace di = boost::di;

  // class ServiceManagerFactory {
  // public:
  //   using ServiceManagerTyped = ServiceManager<TelemetryDataService, TrackMapService>;
  //
  //   ServiceManagerFactory() = default;
  //
  //   template<typename ... ExtraModules>
  //   std::shared_ptr<ServiceManagerTyped> build(ExtraModules &&... extraModules) {
  //     auto injector = di::make_injector(
  //       std::forward<ExtraModules>(extraModules)...,
  //       di::bind<Service>().to<TelemetryDataService,TrackMapService>().in(di::singleton)
  //     );
  //
  //     return injector.template create<std::shared_ptr<ServiceManagerTyped>>();
  //   }
  // };
} // namespace IRacingTools::Shared::Services
