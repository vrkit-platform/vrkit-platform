#pragma once

#include <IRacingTools/SDK/Utils/ConsoleHelpers.h>
#include <IRacingTools/SDK/Utils/LUT.h>
#include <IRacingTools/SDK/Utils/Singleton.h>
#include <IRacingTools/Shared/SharedAppLibPCH.h>


#include <cstdio>
#include <cstdlib>
#include <format>
#include <iostream>
#include <list>
#include <map>
#include <ranges>
#include <string>
#include <string_view>
#include <tuple>

#include <magic_enum.hpp>

#include <spdlog/spdlog.h>


namespace IRacingTools::Shared::Logging {
  using namespace IRacingTools::SDK::Utils;


  namespace Level = spdlog::level;
  using LevelType = Level::level_enum;
  using Logger = std::shared_ptr<spdlog::logger>;

  constexpr std::string_view GlobalCategory{"GLOBAL"};

  enum class LogCategoryDefault {
    Global = 0,
    Service = 1,
    IRSDK = 2
  };

  constexpr std::size_t LogCategoryDefaultCount =
    magic_enum::enum_count<LogCategoryDefault>();

  constexpr LUT<LogCategoryDefault, std::string_view, LogCategoryDefaultCount>
    LogCategoryDefaultMap = {
      {LogCategoryDefault::Global, GlobalCategory},
      {LogCategoryDefault::Service,
       magic_enum::enum_name(LogCategoryDefault::Service).data()},
      {LogCategoryDefault::IRSDK,
       magic_enum::enum_name(LogCategoryDefault::IRSDK).data()}};

  class LoggingManager : public SDK::Utils::Singleton<LoggingManager> {
  public:

    LoggingManager() = delete;
    LoggingManager(LoggingManager &&) = delete;
    LoggingManager(LoggingManager &) = delete;
    LoggingManager(const LoggingManager &) = delete;

    /**
     * @brief Get Logging Category with a user provided name
     *
     * @param name
     * @return Logger
     */
    Logger getCategory(const std::string &name = std::string{GlobalCategory});

    Logger getConsoleLogger();

  protected:

    explicit LoggingManager(token);
    friend Singleton;

  private:

    std::mutex mutex_{};
    std::map<std::string, Logger> loggers_{};
    Logger consoleLogger_{nullptr};
  };


  template <typename T>
  Logger GetCategoryWithType() {
    return LoggingManager::Get().getCategory(PrettyType<T>().name());
  };

  template <LogCategoryDefault Cat>
  Logger GetCategory() {
    std::string name = LogCategoryDefaultMap[Cat];
    return LoggingManager::Get().getCategory(name);
  };

  /**
   * @brief Get logging category with explicit name
   *
   * @param name
   * @return Logger
   */
  inline Logger GetCategoryWithName(const std::string &name) {
    return LoggingManager::Get().getCategory(name);
  };


} // namespace IRacingTools::Shared::Logging

template <typename E>
struct fmt::formatter<E, std::enable_if_t<std::is_enum_v<E>>>
    : fmt::formatter<std::string> {
  auto format(const E &enumValue, fmt::format_context &ctx) const
    -> fmt::format_context::iterator {
    return fmt::formatter<std::string>::format(
      std::string(magic_enum::enum_name<E>(enumValue).data()), ctx);
  }
};
