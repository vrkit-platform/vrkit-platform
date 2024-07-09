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
  namespace log = spdlog;

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
       * @return log::logger 
       */
      log::logger getCategory(const std::string_view& name = GlobalCategory) {
        return log::logger(std::string(name), fileSink_);
      };

  protected:
    explicit LoggingManager(token);
    friend Singleton;

  private:
    std::shared_ptr<log::sinks::rotating_file_sink_mt> fileSink_{nullptr};


  };

  
  template<typename T> log::logger GetCategoryWithType() {
    return LoggingManager::Get().getCategory(std::string(PrettyType<T>().name()));
  };

  template<LogCategoryDefault C> log::logger GetCategory() {
    std::string name = LogCategoryDefaultMap[C];
    return LoggingManager::Get().getCategory(name);
  };

  /**
   * @brief Get logging category with explicit name
   * 
   * @param name 
   * @return log::logger 
   */
  inline log::logger GetCategoryWithName(const std::string_view& name) {
    return LoggingManager::Get().getCategory(std::string(name));
  };

  
}