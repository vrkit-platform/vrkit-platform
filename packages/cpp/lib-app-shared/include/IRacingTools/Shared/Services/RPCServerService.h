#pragma once

#include <IRacingTools/Shared/SharedAppLibPCH.h>

#include <memory>

#include <IRacingTools/Models/rpc/Envelope.pb.h>

#include <IRacingTools/Shared/Common/TaskQueue.h>
#include <IRacingTools/Shared/ProtoHelpers.h>
#include <IRacingTools/Shared/Services/Service.h>


namespace IRacingTools::Shared::Services {

  using namespace Models;
  using namespace Common;

  /**
   * @brief Responsible for handling telemetry data files
   */
  class RPCServerService
      : public std::enable_shared_from_this<RPCServerService>,
        public Service {

  public:
    using Envelope = std::shared_ptr<Models::RPC::Envelope>;
    class Route {
      std::string matchExpression_;
      std::regex matcher_;

    public:
      explicit Route(const std::string &matchExpression = "");
      virtual ~Route() = default;

      virtual bool accepts(const std::string &path);
      virtual std::expected<Envelope, SDK::GeneralError>
      execute(const Envelope &messageIn, const Envelope& messageOut) = 0;
    };

    /**
     * @brief Route implementation that automatically martials the payload
     *
     * @tparam RequestType protobuf message representing the request
     * @tparam ResponseType protobuf message representing the response
     */
    template<typename RequestType, typename ResponseType>
    class TypedRoute : public Route {
    public:
      using Executor = std::function<
          std::expected<std::shared_ptr<ResponseType>, SDK::GeneralError>(
              const std::shared_ptr<RequestType> &,
              const std::shared_ptr<RPC::Envelope> &)>;

      /**
       * @brief Constructor
       *
       * @param executor The function that will receive the request and return
       * the response
       * @param matchExpression ECMAScript compatible regex
       */
      explicit
      TypedRoute(Executor executor, const std::string &matchExpression = "")
          : Route(matchExpression), executor_(executor) {
      }

      virtual std::expected<Envelope, SDK::GeneralError>
      execute(const Envelope &messageIn, const Envelope& messageOut) override {
        auto req = std::make_shared<RequestType>();
        if (!messageIn->payload().UnpackTo(req.get())) {
          return std::unexpected(SDK::GeneralError("Failed to unpack payload"));
        }



        auto result = executor_(req, messageIn);
        if (!result) {
          return std::unexpected(result.error());
        }

        auto response = result.value();
        auto payload = messageOut->mutable_payload();
        VRK_LOG_AND_FATAL_IF(
            !payload->PackFrom(*response), "Unable to pack response message");

        return messageOut;
      }

      static std::shared_ptr<TypedRoute>
      Create(Executor executor, const std::string &matchExpression = "") {
        return std::make_shared<TypedRoute>(std::move(executor),matchExpression);
      }


    private:

      Executor executor_;

    };

    struct Options {
      bool useTaskQueue{false};
    };

    struct {
      // EventEmitter<RPCServerService*, const
      // std::vector<std::shared_ptr<TelemetryDataFile>>&> onFilesChanged{};
    } events;

    RPCServerService() = delete;
    explicit
    RPCServerService(const std::shared_ptr<ServiceContainer> &serviceContainer);
    explicit RPCServerService(
        const std::shared_ptr<ServiceContainer> &serviceContainer,
        const Options &options);

    /**
     * @brief Initialize the service
     */
    virtual std::expected<bool, SDK::GeneralError> init() override;

    /**
     * @brief Must set running == true in overridden implementation
     */
    virtual std::expected<bool, SDK::GeneralError> start() override;

    /**
     * @brief Must set running == false in overridden implementation
     */
    virtual std::optional<SDK::GeneralError> destroy() override;

    Envelope execute(const Envelope &messageIn);

    void addRoute(const std::shared_ptr<Route>& route);



  private:
    Options options_;
    std::mutex routesMutex_{};
    std::vector<std::shared_ptr<Route>> routes_{};
  };
} // namespace IRacingTools::Shared::Services
