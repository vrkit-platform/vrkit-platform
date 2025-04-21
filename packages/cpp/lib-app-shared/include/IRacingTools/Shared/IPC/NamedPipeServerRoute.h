#pragma once
#include <expected>
#include <memory>
#include <regex>

#include <IRacingSDK/ErrorTypes.h>
#include <IRacingTools/Models/RPC/Envelope.pb.h>


namespace IRacingTools::Shared::IPC {
  using namespace Models;
  using Envelope = std::shared_ptr<Models::RPC::Envelope>;
  class NamedPipeServerRoute {
    std::string matchExpression_;
    std::regex matcher_;

  public:
    explicit NamedPipeServerRoute(const std::string &matchExpression = "");
    virtual ~NamedPipeServerRoute() = default;

    virtual bool accepts(const std::string &path);
    virtual std::expected<Envelope, IRacingSDK::GeneralError>
    execute(const Envelope &messageIn, const Envelope& messageOut) = 0;
  };

  /**
   * @brief Route implementation that automatically martials the payload
   *
   * @tparam RequestType protobuf message representing the request
   * @tparam ResponseType protobuf message representing the response
   */
  template<typename RequestType, typename ResponseType>
  class NamedPipeServerTypedRoute : public NamedPipeServerRoute {
  public:
    using Executor = std::function<
        std::expected<std::shared_ptr<ResponseType>, IRacingSDK::GeneralError>(
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
    NamedPipeServerTypedRoute(Executor executor, const std::string &matchExpression = "")
        : NamedPipeServerRoute(matchExpression), executor_(executor) {
    }

    virtual std::expected<Envelope, IRacingSDK::GeneralError>
    execute(const Envelope &messageIn, const Envelope& messageOut) override {
      auto req = std::make_shared<RequestType>();
      if (!messageIn->payload().UnpackTo(req.get())) {
        return std::unexpected(IRacingSDK::GeneralError("Failed to unpack payload"));
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

    static std::shared_ptr<NamedPipeServerTypedRoute>
    Create(Executor executor, const std::string &matchExpression = "") {
      return std::make_shared<NamedPipeServerTypedRoute>(std::move(executor),matchExpression);
    }


  private:

    Executor executor_;

  };
}

