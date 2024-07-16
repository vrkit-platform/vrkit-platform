
#include <IRacingTools/Shared/FileSystemHelpers.h>
#include <IRacingTools/Shared/Logging/LoggingManager.h>
#include <IRacingTools/Shared/Utils/TypeIdHelpers.h>

namespace IRacingTools::Shared::Logging {
  
  namespace {
    
    constexpr std::size_t LogFileMaxSize{1024u * 1024u * 1u};
#ifdef _DEBUG
    constexpr auto LogFlushOn = spdlog::level::debug;
#else
    constexpr auto LogFlushOn = spdlog::level::info;
#endif
  }// namespace

  LoggingManager::LoggingManager(token) {
    auto logDir = GetAppDataPath(Directories::LOGS);
    auto logFile = logDir / Files::LOG_FILENAME;
    std::cerr << std::format("Writing to log file ({})\n", logFile.string());

    fileSink_ = std::make_shared<spdlog::sinks::rotating_file_sink_mt>(logFile.string(), LogFileMaxSize, 1u);
    fileSink_->set_level(Level::trace);
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
    auto res = Utils::GetPrettyTypeId(name, {"IRacingTools::"});
    if (res) {
      auto& typeId = res.value();
      prettyName = typeId.fullname;
    }
    if (!loggers_.contains(prettyName)) {
      auto logger = std::make_shared<spdlog::logger>(prettyName, fileSink_);
      logger->set_level(spdlog::level::level_enum::debug);
      logger->flush_on(LogFlushOn);
      loggers_[prettyName] = logger;
    }
    return loggers_[prettyName];
  };
}// namespace IRacingTools::Shared::Logging