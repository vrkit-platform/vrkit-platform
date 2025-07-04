
#include <fmt/core.h>
#include <gtest/gtest.h>

#include <IRacingSDK/Utils/ConsoleHelpers.h>
#include <VRKit/Shared/FileSystemHelpers.h>
#include <VRKit/Shared/Common/UUIDHelpers.h>

#include <VRKit/Shared/Logging/LoggingManager.h>
#include <VRKit/Shared/Services/ServiceManager.h>
#include <VRKit/Shared/Services/RPCServerService.h>

using namespace VRKit::Shared::Logging;
using namespace IRacingSDK;
using namespace IRacingSDK::Utils;
using namespace VRKit::Shared;
using namespace VRKit::Models;

using namespace VRKit::Shared::Services;

namespace fs = std::filesystem;

namespace {
  
  class RPCServerServiceTests;

  auto L = GetCategoryWithType<RPCServerServiceTests>();


  class RPCServerServiceTests : public testing::Test {
  protected:
    RPCServerServiceTests() = default;

    virtual void TearDown() override {
      L->flush();
    }



  private:

  };

}// namespace

TEST_F(RPCServerServiceTests, SimpleRouteSync) {
  using ServiceManagerType = ServiceManager<RPCServerService>;
  auto manager = std::make_shared<ServiceManagerType>();

  EXPECT_EQ(1, ServiceManagerType::ServiceCount);
  manager->init();
  manager->start();
  auto sampleRouteExecutor = [&] (const std::shared_ptr<SizeI> & request,
              const std::shared_ptr<RPC::Envelope> & envelope) -> std::expected<std::shared_ptr<SizeI>, GeneralError> {
    L->info("Processing request path: {}", envelope->path());
    auto response = std::make_shared<SizeI>();
    response->set_width(request->width() * 2);
    response->set_height(request->height() * 2);
    return response;
  };

  auto sampleRoute = RPCServerService::TypedRoute<SizeI, SizeI>::Create(sampleRouteExecutor, "/sample");

  auto rpcService = manager->getService<RPCServerService>();
  rpcService->addRoute(sampleRoute);

  auto messageIn = std::make_shared<VRKit::Models::RPC::Envelope>();
  messageIn->set_id(NewUUID());
  messageIn->set_path("/sample");
  messageIn->set_kind(RPC::Envelope::KIND_REQUEST);

  SizeI sampleRouteRequest {};

  sampleRouteRequest.set_width(2);
  sampleRouteRequest.set_height(2);

  SizeI sampleRouteResponse{};

  ASSERT_TRUE(messageIn->mutable_payload()->PackFrom(sampleRouteRequest));

  auto messageOut = rpcService->execute(messageIn);
  EXPECT_EQ(messageOut->status(), RPC::Envelope::STATUS_DONE);

  ASSERT_TRUE(messageOut->mutable_payload()->UnpackTo(&sampleRouteResponse));

  EXPECT_EQ(sampleRouteResponse.width(),sampleRouteRequest.width() * 2);
  EXPECT_EQ(sampleRouteResponse.height(),sampleRouteRequest.height() * 2);


  messageIn->set_id(NewUUID());
  messageIn->set_path("/sample2");

  messageOut = rpcService->execute(messageIn);

  EXPECT_EQ(messageOut->status(), RPC::Envelope::STATUS_ERROR);
  manager->destroy();
}
