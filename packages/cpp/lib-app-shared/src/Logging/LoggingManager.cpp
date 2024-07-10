
#include <IRacingTools/Shared/FileSystemHelpers.h>
#include <IRacingTools/Shared/Logging/LoggingManager.h>
namespace IRacingTools::Shared::Logging {

  namespace {
    constexpr auto LogFilename{"vrkit.log"};
    constexpr std::size_t LogFileMaxSize{1024u * 1024u * 1u};
  }// namespace

  LoggingManager::LoggingManager(token) {
    auto logFile = GetIRacingDocumentPath().value() / LogFilename;
    std::cerr << std::format("Writing to log file ({})\n", logFile.string());

    if (fs::exists(logFile)) {
      fs::remove(logFile);
    }

    fileSink_ = std::make_shared<spdlog::sinks::rotating_file_sink_mt>(logFile.string(), LogFileMaxSize, 1u);
    fileSink_->set_level(spdlog::level::debug);
  }

  /**
       * @brief Get Logging Category with a user provided name
       * 
       * @param name 
       * @return log::logger 
       */
  Logger LoggingManager::getCategory(const std::string &name) {
    std::scoped_lock lock(mutex_);
    if (!loggers_.contains(name)){
      loggers_[name] = std::make_shared<log::logger>(name, fileSink_);
      loggers_[name]->set_level(spdlog::level::debug);
      }
    return loggers_[name];
  };
}// namespace IRacingTools::Shared::Logging