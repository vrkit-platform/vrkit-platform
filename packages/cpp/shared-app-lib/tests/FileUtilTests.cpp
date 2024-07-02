#include <IRacingTools/Shared/FileSystemHelpers.h>
#include <IRacingTools/Shared/FileWatcher.h>

#include <gtest/gtest.h>

using namespace IRacingTools::Shared::FileSystem;
using namespace IRacingTools::Shared;
using namespace IRacingTools::SDK;

using namespace  std::chrono_literals;

class FileUtilTests : public testing::Test {
    protected:
        FileUtilTests() = default;

        virtual void TearDown() override {
            spdlog::default_logger()->flush();
        }
};

TEST_F(FileUtilTests, Files_GetIRacingDocumentPath) {
    auto irTelemPath = GetIRacingDocumentPath("telemetry");
    EXPECT_TRUE(irTelemPath.has_value());
}




