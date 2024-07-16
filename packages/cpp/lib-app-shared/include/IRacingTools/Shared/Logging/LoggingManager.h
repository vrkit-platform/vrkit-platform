#pragma once

#include <IRacingTools/Shared/SharedAppLibPCH.h>
#include <IRacingTools/SDK/Utils/ConsoleHelpers.h>
#include <IRacingTools/SDK/Utils/LUT.h>
#include <IRacingTools/SDK/Utils/Singleton.h>


#include <cstdio>
#include <format>
#include <iostream>
#include <list>
#include <map>
#include <ranges>
#include <cstdlib>
#include <string>
#include <string_view>
#include <tuple>

#include <magic_enum.hpp>
#include <spdlog/sinks/rotating_file_sink.h>
#include <spdlog/spdlog.h>



namespace IRacingTools::Shared::Logging {
  using namespace IRacingTools::SDK::Utils;
  
  
  namespace Level = spdlog::level;
  using Logger = std::shared_ptr<spdlog::logger>;

  constexpr std::string_view GlobalCategory {"GLOBAL"};

  enum class LogCategoryDefault {
    Global = 0,
    Service = 1
  };

  constexpr std::size_t LogCategoryDefaultCount = magic_enum::enum_count<LogCategoryDefault>();

  constexpr LUT<LogCategoryDefault, std::string_view, LogCategoryDefaultCount> LogCategoryDefaultMap = {
    {LogCategoryDefault::Global, GlobalCategory},
    {LogCategoryDefault::Service, magic_enum::enum_name(LogCategoryDefault::Service).data()}
  };

  class LoggingManager : public SDK::Utils::Singleton<LoggingManager> {
    public:
      LoggingManager() = delete;
      LoggingManager(LoggingManager&&) = delete;
      LoggingManager(LoggingManager&) = delete;
      LoggingManager(const LoggingManager&) = delete;

      /**
       * @brief Get Logging Category with a user provided name
       * 
       * @param name 
       * @return Logger 
       */
      Logger getCategory(const std::string& name = std::string{GlobalCategory});

  protected:
    explicit LoggingManager(token);
    friend Singleton;

  private:
    std::mutex mutex_{};
    std::shared_ptr<spdlog::sinks::rotating_file_sink_mt> fileSink_{nullptr};
    std::map<std::string,Logger> loggers_{};

  };

  
  template<typename T> Logger GetCategoryWithType() {
    return LoggingManager::Get().getCategory(PrettyType<T>().name());
  };

  template<LogCategoryDefault Cat> Logger GetCategory() {
    std::string name = LogCategoryDefaultMap[Cat];
    return LoggingManager::Get().getCategory(name);
  };

  /**
   * @brief Get logging category with explicit name
   * 
   * @param name 
   * @return Logger
   */
  inline Logger GetCategoryWithName(const std::string_view& name) {
    return LoggingManager::Get().getCategory(std::string(name));
  };

  
}