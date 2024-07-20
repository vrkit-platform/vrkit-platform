#pragma once

#include <memory>
#include <spdlog/logger.h>
#include <IRacingTools/SDK/Utils/Singleton.h>

namespace IRacingTools::SDK {

  class LogInstance : public Utils::Singleton<LogInstance> {
    /**
     * @brief Create LogInstance
     */
    explicit LogInstance(token){};
    friend Singleton;

  public:
    LogInstance() = delete;

    /**
     * @brief
     * @param newLogger new logger to assign globally
     * @return previous logger or nullptr if not assigned
     */
    std::shared_ptr<spdlog::logger> setDefaultLogger(const std::shared_ptr<spdlog::logger>& newLogger);

    std::shared_ptr<spdlog::logger> getDefaultLogger();
  };


} // namespace IRacingTools::SDK
