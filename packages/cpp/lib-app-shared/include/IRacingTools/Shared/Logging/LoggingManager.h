#pragma once

#include <IRacingSDK/Utils/ConsoleHelpers.h>
#include <IRacingSDK/Utils/LUT.h>
#include <IRacingSDK/Utils/Singleton.h>
#include <IRacingTools/Shared/SharedAppLibPCH.h>
#include <IRacingTools/Shared/Utils/TypeIdHelpers.h>

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

#include <magic_enum/magic_enum.hpp>
#include <spdlog/spdlog.h>


namespace IRacingTools::Shared::Logging {
  using namespace IRacingSDK::Utils;
  using namespace IRacingTools::Shared::Utils;


  namespace Level = spdlog::level;
  using LevelType = Level::level_enum;
  using Logger = std::shared_ptr<spdlog::logger>;

  constexpr std::string_view GlobalCategory{"GLOBAL"};

  enum class LogCategoryDefault {
    Global = 0,
    Service = 1,
    IRSDK = 2
  };

  constexpr std::size_t LogCategoryDefaultCount = magic_enum::enum_count<LogCategoryDefault>();

  // ReSharper disable once CppEvaluationInternalFailure
  constexpr LUT<LogCategoryDefault, std::string_view, LogCategoryDefaultCount>
  LogCategoryDefaultMap = {
    {LogCategoryDefault::Global, GlobalCategory},
    {LogCategoryDefault::Service, magic_enum::enum_name(LogCategoryDefault::Service).data()},
    {LogCategoryDefault::IRSDK, magic_enum::enum_name(LogCategoryDefault::IRSDK).data()}
  };

  class LoggingManager : public IRacingSDK::Utils::Singleton<LoggingManager> {
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
    // ReSharper disable once CppEvaluationInternalFailure
    std::string name{LogCategoryDefaultMap[Cat]};
    return LoggingManager::Get().getCategory(name);
  };

  /**
   * @brief Get logging category with explicit name
   *
   * @param name
   * @return Logger
   */
  inline Logger GetCategoryWithName(const std::string& name) {
    return LoggingManager::Get().getCategory(name);
  };

  /**
   * @brief Get logging category with file name.
   *
   * @param filename name of the file to use as a category, usually `__FILE__`
   * @return Logger instance with the category name derived from the file name
   */
  inline Logger GetCategoryWithFile(const std::string& filename) {
    std::string name = filename;
    auto idx = name.find_last_of(".");
    if (idx != std::string::npos) {
      name = name.substr(0, idx);
    }

    return GetCategoryWithName(name);
  };


} // namespace IRacingTools::Shared::Logging

template <typename E>
struct fmt::formatter<E, std::enable_if_t<std::is_enum_v<E>>> : fmt::formatter<std::string> {
  auto format(const E& enumValue, fmt::format_context& ctx) const -> fmt::format_context::iterator {
    return fmt::formatter<std::string>::format(std::string(magic_enum::enum_name<E>(enumValue).data()), ctx);
  }
};
