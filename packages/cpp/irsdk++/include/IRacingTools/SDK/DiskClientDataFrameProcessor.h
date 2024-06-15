#pragma once

#include <filesystem>
#include <spdlog/spdlog.h>

#include "DiskClient.h"
#include "Utils/ChronoHelpers.h"

// A C++ wrapper around the irsdk calls that takes care of reading a .ibt file
namespace IRacingTools::SDK {
    namespace fs = std::filesystem;

    template <typename Data>
    class DiskClientDataFrameProcessor {
        DiskClient client_;

        public:
            struct Context {
                DiskClient* client{nullptr};
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

            explicit DiskClientDataFrameProcessor(const std::filesystem::path& file) : client_(file, file.string()) {}

            DiskClientDataFrameProcessor() = delete;
            DiskClientDataFrameProcessor(const DiskClientDataFrameProcessor& other) = delete;
            DiskClientDataFrameProcessor(DiskClientDataFrameProcessor&& other) noexcept = delete;
            DiskClientDataFrameProcessor& operator=(const DiskClientDataFrameProcessor& other) = delete;
            DiskClientDataFrameProcessor& operator=(DiskClientDataFrameProcessor&& other) noexcept = delete;

            virtual ~DiskClientDataFrameProcessor() = default;

            /**
             * @brief Session update string (yaml)
             *
             * @return string_view or error if unavailable
             */
            std::expected<std::size_t, GeneralError> run(const Callback& callback, Data& data) {
                auto& diskClient = client_;
                std::size_t processedFrameCount{0};
                while (true) {
                    if (!diskClient.next()) {
                        spdlog::error("Unable to get next: {}", diskClient.getSampleIndex());
                        break;
                    }


                    auto sessionTimeVal = diskClient.getVarDouble(KnownVarName::SessionTime);
                    if (!sessionTimeVal) {
                        spdlog::error("No session time");
                        return std::unexpected(GeneralError::create<GeneralError>(ErrorCode::General, "No session time in frame index {}", diskClient.getSampleIndex()));
                    }

                    auto sessionTimeSeconds = sessionTimeVal.value();
                    Context context{
                        .client = &diskClient,
                        .processor = this,
                        .sessionTimeSeconds = sessionTimeSeconds,
                        .sessionTime = Utils::SessionTimeToDuration(sessionTimeSeconds),
                        .frameIndex = diskClient.getSampleIndex(),
                        .frameCount = diskClient.getSampleCount()
                    };

                    auto shouldContinue = callback(context, data);
                    processedFrameCount++;

                    if (!shouldContinue) {
                        spdlog::info(
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
