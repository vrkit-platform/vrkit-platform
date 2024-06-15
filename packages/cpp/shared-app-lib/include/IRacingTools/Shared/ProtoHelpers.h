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
  using namespace IRacingTools::SDK;
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

  template<typename MessageClazz> class JSONLinesMessageFileHandler {
    

  private:
    std::mutex persistMutex_{};
    fs::path file_;

  public:
    struct {
      SDK::Utils::EventEmitter<std::vector<MessageClazz> &> onRead{};
      SDK::Utils::EventEmitter<std::vector<MessageClazz> &> onWrite{};
    } events{};

    virtual std::expected<std::vector<MessageClazz>, GeneralError> read() {
      std::scoped_lock lock(persistMutex_);

      auto fileExists = fs::exists(file_);
      info("Loading messages from ({}), exists={}", file_.string(), fileExists);

      if (!fileExists)
        return std::unexpected(SDK::GeneralError(ErrorCode::NotFound, "File not found"));

      std::vector<MessageClazz> msgs;
      auto jsonLinesRes = SDK::Utils::ReadTextFile(file_);
      assert(jsonLinesRes.has_value());

      std::istringstream jsonLinesStream(jsonLinesRes.value());


      std::string jsonLine;
      google::protobuf::util::JsonParseOptions jsonParseOptions{};

      while (std::getline(jsonLinesStream, jsonLine)) {
        MessageClazz msg{};

        if (!jsonLine.starts_with("{") || !jsonLine.ends_with("}")) {
          warn("Invalid json line, skipping remainder: {}", jsonLine);
          break;
        }
        auto jsonParseRes = JsonStringToMessage(jsonLine, &msg, jsonParseOptions);
        if (!jsonParseRes.ok()) {
          warn("Json parse error ({}), skipping remainder: {}", magic_enum::enum_name(jsonParseRes.code()).data(),
               jsonParseRes.message().ToString());
          break;
        }

        msgs.push_back(std::move(msg));
      }

      return msgs;
    }

    virtual std::expected<std::size_t, GeneralError> write(const std::vector<MessageClazz> &messages) {
      std::scoped_lock lock(persistMutex_);

      std::stringstream data{};
      google::protobuf::util::JsonPrintOptions jsonOptions{};
      for (auto &msg: messages) {
        std::string msgStr;
        
        auto jsonSerializeRes = MessageToJsonString(msg, &msgStr, jsonOptions);
        if (!jsonSerializeRes.ok()) {
          warn("Json serialize error ({}), skipping remainder: {}",
               magic_enum::enum_name(jsonSerializeRes.code()).data(), jsonSerializeRes.message().ToString());

          return std::unexpected(
              GeneralError(ErrorCode::General, fmt::format("Serialize error: {}", jsonSerializeRes.message().ToString())));
        
        }

        data << msgStr << "\n";
      }

        auto writeRes = SDK::Utils::WriteTextFile(file_, data.str());
        if (!writeRes) {
            return std::unexpected(
              GeneralError(ErrorCode::General, fmt::format("Failed to write error: {}", writeRes.error().what())));
        }
        return writeRes.value();
    };
  

    JSONLinesMessageFileHandler(const fs::path &file) : file_(file) {
    }

    virtual ~JSONLinesMessageFileHandler() = default;
  };
}// namespace IRacingTools::Shared::Utils