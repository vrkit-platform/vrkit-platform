
#include <IRacingTools/SDK/LogInstance.h>
#include <IRacingTools/Shared/FileSystemHelpers.h>
#include <IRacingTools/Shared/Logging/LoggingManager.h>
#include <IRacingTools/Shared/Utils/TypeIdHelpers.h>
#include <IRacingTools/Shared/Utils/Win32ProcessTool.h>

#include <spdlog/sinks/rotating_file_sink.h>
#include <spdlog/sinks/wincolor_sink.h>

namespace IRacingTools::Shared::Logging {
  
  namespace {
    
    constexpr std::size_t LogFileMaxSize{1024u * 1024u * 1u};
#ifdef _DEBUG
    // constexpr auto LogFlushOn = spdlog::level::debug;
    constexpr auto LogLevel = spdlog::level::info;
    constexpr auto LogFlushOn = spdlog::level::info;
#else
    constexpr auto LogLevel = spdlog::level::info;
    constexpr auto LogFlushOn = spdlog::level::info;
#endif

    std::shared_ptr<spdlog::sinks::rotating_file_sink_mt> gFileSink{nullptr};
    std::shared_ptr<spdlog::sinks::wincolor_stdout_sink_mt> gConsoleSink{nullptr};
    bool gFileSinkEnabled;
  }// namespace


  LoggingManager::LoggingManager(token) {
    //auto processName = Utils::GetProcessName();
    gFileSinkEnabled = Utils::GetProcessName() != "vrkit_tool";
    if (gFileSinkEnabled) {
      auto logDir = GetAppDataPath(Directories::LOGS);
      auto logFile = logDir / std::format("{}-{}.log", Files::LOG_FILENAME_PREFIX, Utils::GetProcessName());
      std::cerr << std::format("Writing to log file ({})\n", logFile.string());

      gFileSink = std::make_shared<spdlog::sinks::rotating_file_sink_mt>(logFile.string(), LogFileMaxSize, 1u);
      gFileSink->set_level(Level::trace);
    } else {
      gConsoleSink = std::make_shared<spdlog::sinks::wincolor_stdout_sink_mt>();
    }

    SDK::LogInstance::Get()
      .setDefaultLogger(getCategory(std::string{LogCategoryDefaultMap[LogCategoryDefault::IRSDK]}));
  }

  /**
   * @brief Get Logging Category with a user provided name
   * 
   * @param name 
   * @return Logger
   */
  Logger LoggingManager::getCategory(const std::string &name) {
    std::scoped_lock lock(mutex_);
    std::string prettyName = name;

    for (auto c : {'/','\\'}) {
      auto pos = prettyName.find_last_of(c);
      if (pos != std::string::npos && prettyName.length() > pos + 1) {
        prettyName = prettyName.substr(pos + 1);
      }
    }

    auto res = Utils::GetPrettyTypeId(name, {"IRacingTools::","VRK::","VRKit::","VRRK::","VRRKit::"});
    if (res) {
      auto &typeId = res.value();
      prettyName = typeId.fullname;
    }

    if (!loggers_.contains(prettyName)) {
      std::shared_ptr<spdlog::logger> logger;
      if (gFileSinkEnabled) {
        logger = std::make_shared<spdlog::logger>(prettyName, gFileSink);
        logger->flush_on(LogFlushOn);
      } else {
        logger = std::make_shared<spdlog::logger>(prettyName,gConsoleSink);
      }
      // logger->set_level(LogLevel);
      loggers_[prettyName] = logger;
    }
    return loggers_[prettyName];
  }

  Logger LoggingManager::getConsoleLogger() {
    if (!consoleLogger_) {
      std::scoped_lock lock(mutex_);
      if (!consoleLogger_) {
        consoleLogger_ = spdlog::default_logger();
      }
    }
    return consoleLogger_;
  };
}// namespace IRacingTools::Shared::Logging