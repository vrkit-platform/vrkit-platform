
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
  }
}// namespace IRacingTools::Shared::Logging