#pragma once

#include <filesystem>
#include <fmt/core.h>
#include <IRacingTools/SDK/DiskClient.h>
#include <IRacingTools/SDK/LogInstance.h>
#include <IRacingTools/SDK/Utils/ChronoHelpers.h>

// A C++ wrapper around the irsdk calls that takes care of reading a .ibt file
namespace IRacingTools::SDK {
    namespace fs = std::filesystem;

    template <typename Data>
    class DiskClientDataFrameProcessor {
        std::shared_ptr<DiskClient> client_;

        public:
            struct Context {
                std::shared_ptr<DiskClient> client{nullptr};
                DiskClientDataFrameProcessor* processor{nullptr};

                double sessionTimeSeconds{};
                SessionTime sessionTime{};

                std::size_t frameIndex{};
                std::size_t frameCount{};
            };

            /**
             * @brief Callback invoked on each frame of data
             *
             */
            using Callback = std::function<bool(const Context& context, Data& result)>;

            explicit DiskClientDataFrameProcessor(const std::filesystem::path& file) : client_(
                std::make_shared<DiskClient>(file, file.string())
            ) {}

            explicit DiskClientDataFrameProcessor(const std::shared_ptr<DiskClient>& client) : client_(client) {}

            DiskClientDataFrameProcessor() = delete;
            DiskClientDataFrameProcessor(const DiskClientDataFrameProcessor& other) = delete;
            DiskClientDataFrameProcessor(DiskClientDataFrameProcessor&& other) noexcept = delete;
            DiskClientDataFrameProcessor& operator=(const DiskClientDataFrameProcessor& other) = delete;
            DiskClientDataFrameProcessor& operator=(DiskClientDataFrameProcessor&& other) noexcept = delete;

            virtual ~DiskClientDataFrameProcessor() = default;

            std::shared_ptr<DiskClient> getClient() {
                return client_;
            }

            /**
             * @brief Session update string (yaml)
             *
             * @return string_view or error if unavailable
             */
            std::expected<std::size_t, GeneralError> run(const Callback& callback, Data& data) {
                static auto L = GetDefaultLogger();
                auto& diskClient = client_;
                std::size_t processedFrameCount{0};
                while (true) {
                    if (!diskClient->next()) {
                        L->error("Unable to get next: {}", diskClient->getSampleIndex());
                        break;
                    }


                    auto sessionTimeVal = diskClient->getVarDouble(KnownVarName::SessionTime);
                    if (!sessionTimeVal) {
                        L->error("No session time");
                        return std::unexpected(
                            GeneralError(
                                ErrorCode::General,
                                fmt::format("No session time in frame index {}", diskClient->getSampleIndex())
                            )
                        );
                    }

                    auto sessionTimeSeconds = sessionTimeVal.value();
                    Context context{
                        .client = diskClient,
                        .processor = this,
                        .sessionTimeSeconds = sessionTimeSeconds,
                        .sessionTime = Utils::SessionTimeToDuration(sessionTimeSeconds),
                        .frameIndex = diskClient->getSampleIndex(),
                        .frameCount = diskClient->getSampleCount()
                    };

                    auto shouldContinue = callback(context, data);
                    processedFrameCount++;

                    if (!shouldContinue) {
                        L->info(
                            "Stopped processing due to callback returning false on frame {} of {}",
                            context.frameIndex,
                            context.frameCount
                        );
                        break;
                    }
                }

                return processedFrameCount;
            }
    };
} // namespace IRacingTools::SDK
