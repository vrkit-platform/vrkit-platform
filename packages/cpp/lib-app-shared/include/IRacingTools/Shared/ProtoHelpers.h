//
// Created by jglanz on 1/17/2024.
//

#pragma once


#include <google/protobuf/util/json_util.h>
#include <magic_enum.hpp>

#include "Macros.h"
#include <IRacingTools/SDK/ErrorTypes.h>
#include <IRacingTools/SDK/Utils/EventEmitter.h>
#include <IRacingTools/SDK/Utils/FileHelpers.h>


#define IRT_PROTO_CMP(O1, O2, MEMBER) O1.MEMBER() == O2.MEMBER()

namespace IRacingTools::Shared::Utils {
  using namespace ::IRacingTools::SDK;
  using namespace spdlog;

  template<typename MessageClazz> std::optional<MessageClazz> ReadMessageFromFile(const std::filesystem::path &path) {
    auto res = SDK::Utils::ReadFile(path);
    if (!res.has_value()) {
      return std::nullopt;
    }

    auto data = res.value();
    if (data.empty()) {
      return std::nullopt;
    };

    MessageClazz msg;
    msg.ParseFromArray(data.data(), data.size());
    return std::make_optional(std::move(msg));
  };

  /**
   * @brief 
   */
  template<typename MessageClazz> 
  class JSONLinesMessageFileHandler {

  private:
    std::mutex persistMutex_{};
    fs::path file_;

  public:
    /**
     * @brief Event emitters
     */
    struct {
      SDK::Utils::EventEmitter<std::vector<std::shared_ptr<MessageClazz>> &> onRead{};
      SDK::Utils::EventEmitter<const std::vector<std::shared_ptr<MessageClazz>> &> onWrite{};
    } events{};

    /**
     * @brief Read the underlying `jsonl` file
     * 
     * @return std::expected<std::vector<std::shared_ptr<MessageClazz>>, GeneralError> 
     */
    virtual std::expected<std::vector<std::shared_ptr<MessageClazz>>, GeneralError> read() {
      std::scoped_lock lock(persistMutex_);

      auto fileExists = fs::exists(file_);
      info("Loading messages from ({}), exists={}", file_.string(), fileExists);

      if (!fileExists)
        return std::unexpected(SDK::GeneralError(ErrorCode::NotFound, "File not found"));

      std::vector<std::shared_ptr<MessageClazz>> msgs;
      auto jsonLinesRes = SDK::Utils::ReadTextFile(file_);
      assert(jsonLinesRes.has_value());

      std::istringstream jsonLinesStream(jsonLinesRes.value());


      std::string jsonLine;
      google::protobuf::util::JsonParseOptions jsonParseOptions{};

      while (std::getline(jsonLinesStream, jsonLine)) {
        auto msg = std::make_shared<MessageClazz>();;

        if (!jsonLine.starts_with("{") || !jsonLine.ends_with("}")) {
          warn("Invalid json line, skipping remainder: {}", jsonLine);
          break;
        }
        auto jsonParseRes = JsonStringToMessage(jsonLine, msg.get(), jsonParseOptions);
        if (!jsonParseRes.ok()) {
          warn("Json parse error ({}), skipping remainder: {}", magic_enum::enum_name(jsonParseRes.code()).data(),
               std::string{jsonParseRes.message()});
          break;
        }

        msgs.push_back(std::move(msg));
      }

      events.onRead.publish(msgs);

      return msgs;
    }
    
    virtual std::expected<std::size_t, GeneralError> write(const std::vector<std::shared_ptr<MessageClazz>> &messages) {
      std::scoped_lock lock(persistMutex_);

      std::stringstream data{};
      google::protobuf::util::JsonPrintOptions jsonOptions{};
      for (auto& msg: messages) {
        std::string msgStr;

        auto jsonSerializeRes = MessageToJsonString(*msg.get(), &msgStr, jsonOptions);
        if (!jsonSerializeRes.ok()) {
          warn("Json serialize error ({}), skipping remainder: {}",
               magic_enum::enum_name(jsonSerializeRes.code()).data(), std::string{jsonSerializeRes.message()});

          return std::unexpected(GeneralError(
              ErrorCode::General, fmt::format("Serialize error: {}", std::string{jsonSerializeRes.message()})));
        }

        data << msgStr << "\n";
      }

      auto writeRes = SDK::Utils::WriteTextFile(file_, data.str());
      if (!writeRes) {
        return std::unexpected(
            GeneralError(ErrorCode::General, fmt::format("Failed to write error: {}", writeRes.error().what())));
      }

      events.onWrite.publish(messages);
      return writeRes.value();
    };


    JSONLinesMessageFileHandler(const fs::path &file) : file_(file) {
    }

    virtual ~JSONLinesMessageFileHandler() = default;
  };
}// namespace IRacingTools::Shared::Utils