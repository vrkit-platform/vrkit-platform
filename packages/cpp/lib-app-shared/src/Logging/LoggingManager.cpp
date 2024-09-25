
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
    constexpr auto LogFlushOn = spdlog::level::debug;
#else
    constexpr auto LogFlushOn = spdlog::level::info;
#endif

    std::shared_ptr<spdlog::sinks::rotating_file_sink_mt> gFileSink{nullptr};
  }// namespace

  LoggingManager::LoggingManager(token) {
    auto logDir = GetAppDataPath(Directories::LOGS);
    auto logFile = logDir / std::format("{}-{}.log", Files::LOG_FILENAME_PREFIX, Utils::GetProcessName());
    std::cerr << std::format("Writing to log file ({})\n", logFile.string());

    gFileSink = std::make_shared<spdlog::sinks::rotating_file_sink_mt>(logFile.string(), LogFileMaxSize, 1u);
    gFileSink->set_level(Level::trace);
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
      auto logger = std::make_shared<spdlog::logger>(prettyName, gFileSink);
      logger->set_level(spdlog::level::level_enum::debug);
      logger->flush_on(LogFlushOn);
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