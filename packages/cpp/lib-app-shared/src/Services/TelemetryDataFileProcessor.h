#pragma once

#include <IRacingTools/Shared/SharedAppLibPCH.h>

#include <memory>

#include <IRacingTools/Models/Pipeline.pb.h>
#include <IRacingTools/Models/TelemetryDataFile.pb.h>

#include <IRacingTools/SDK/Utils/Base64.h>
#include <IRacingTools/SDK/Utils/CollectionHelpers.h>
#include <IRacingTools/SDK/Utils/RunnableThread.h>
#include <IRacingTools/SDK/Utils/LUT.h>

#include <IRacingTools/Shared/FileWatcher.h>
#include <IRacingTools/Shared/ProtoHelpers.h>
#include <IRacingTools/Shared/Services/Service.h>
#include <IRacingTools/Shared/Services/TelemetryDataService.h>

namespace IRacingTools::Shared::Services {

  using namespace Models;
  
  class TelemetryDataFileProcessor : public RunnableThread {
  public:
    using Request = TelemetryDataService::Request;
    using Result = TelemetryDataService::Result;

  private:
    TelemetryDataService *service_;
    std::mutex requestMutex_{};
    std::condition_variable requestCondition_{};
    std::atomic_bool isProcessing_{false};
    std::deque<std::shared_ptr<Request>> requests_{};


  public:
    explicit TelemetryDataFileProcessor(TelemetryDataService *service);
    ;

    std::shared_ptr<Request>
    findRequestInternal(const std::vector<fs::path> &files = {});

    std::shared_ptr<Request>
    findRequest(const std::vector<fs::path> &files = {});

    /**
     * @brief Submit a new request
     *
     * @param files
     * @return std::shared_ptr<Request>
     */
    std::shared_ptr<Request>
    submitRequest(const std::vector<fs::path> &files = {});

    virtual void runnable() override;

    /**
     * @brief
     * @return true if either a request is being processed or if there are any
     * pending requests
     */
    bool isProcessing();
  };

} // namespace IRacingTools::Shared::Services
