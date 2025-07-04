//
// Created by jglanz on 1/17/2024.
//

#pragma once


#include <google/protobuf/util/json_util.h>
#include <magic_enum/magic_enum.hpp>

#include <VRKit/Models/FileInfo.pb.h>
#include <IRacingSDK/ErrorTypes.h>
#include <IRacingSDK/Utils/EventEmitter.h>
#include <IRacingSDK/Utils/FileHelpers.h>

#include <VRKit/Shared/FileSystemHelpers.h>
#include <VRKit/Shared/Logging/LoggingManager.h>
#include <VRKit/Shared/Macros.h>

#define VRK_PROTO_CMP(O1, O2, MEMBER) O1.MEMBER() == O2.MEMBER()

namespace VRKit::Shared::Utils {
  using namespace ::IRacingSDK;
  using FileInfoClock = std::chrono::system_clock;
  std::expected<std::shared_ptr<Models::FileInfo>, IRacingSDK::GeneralError> GetFileInfo(const fs::path& path);

  /**
   * @copydoc GetFileInfo
   */
  std::expected<std::shared_ptr<Models::FileInfo>, IRacingSDK::GeneralError> GetFileInfo(const std::shared_ptr<Models::FileInfo>& fileInfo, std::optional<fs::path> path = std::nullopt);
  /**
   * @brief Populate an instance of `Models::FileInfo` based on the provided
   * path
   *
   * @param fileInfo to populate based on `path`
   * @param path
   * @return `FileInfo*` or `GeneralError`
   */
  std::expected<Models::FileInfo*, IRacingSDK::GeneralError> GetFileInfo(Models::FileInfo* fileInfo, std::optional<fs::path> path = std::nullopt);


  bool FileInfoPathMatch(const Models::FileInfo* fileInfo1, const Models::FileInfo* fileInfo2);

  /**
   * @brief Update `Models::FileInfo` timestamps based on the file specified
   *  in the protobuf
   *
   * @see FileInfo.proto
   * @param fileInfo shared pointer to `Models::FileInfo`
   * @return if an error occurs then its return, otherwise `std::nullopt`
   */
  std::optional<IRacingSDK::GeneralError> UpdateFileInfoTimestamps(const std::shared_ptr<Models::FileInfo>& fileInfo);

  /**
   * @copydoc UpdateFileInfoTimestamps(const std::shared_ptr<Models::FileInfo>&)
   */
  std::optional<IRacingSDK::GeneralError> UpdateFileInfoTimestamps(Models::FileInfo * fileInfo);

  template<typename MessageClazz>
  std::optional<MessageClazz> ReadMessageFromFile(const std::filesystem::path &path) {
    auto res = IRacingSDK::Utils::ReadFile(path);
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

  template<typename MessageClazz>
  bool WriteMessageToFile(const MessageClazz& msg, const std::filesystem::path &path) {
    std::vector<uint8_t> msgData;
    msgData.resize(msg.ByteSizeLong());
    msg.SerializeToArray(msgData.data(), msgData.size());
    auto res = IRacingSDK::Utils::WriteFile(path, msgData);
    if (!res.has_value()) {
      return false;
    }
    
    return true;
  };

  /**
   * @brief 
   */
  template<typename MessageClazz>
  class JSONLinesMessageFileHandler {

  private:
    inline static Logging::Logger L{Logging::GetCategoryWithType<JSONLinesMessageFileHandler<MessageClazz>>()};
    std::mutex persistMutex_{};
    fs::path file_;


  public:
    /**
     * @brief Event emitters
     */
    struct {
      IRacingSDK::Utils::EventEmitter<std::vector<std::shared_ptr<MessageClazz>> &> onRead{};
      IRacingSDK::Utils::EventEmitter<const std::vector<std::shared_ptr<MessageClazz>> &> onWrite{};
    } events{};

    virtual fs::path file() {
      return file_;
    };

    /**
     * @brief Read the underlying `jsonl` file
     * 
     * @return std::expected<std::vector<std::shared_ptr<MessageClazz>>, GeneralError> 
     */
    virtual std::expected<std::vector<std::shared_ptr<MessageClazz>>, GeneralError> read() {
      // static auto L{Logging::GetCategoryWithType<}
      std::scoped_lock lock(persistMutex_);

      auto fileExists = fs::exists(file_);
      L->info("Loading messages from ({}), exists={}", file_.string(), fileExists);

      if (!fileExists)
        return std::unexpected(IRacingSDK::GeneralError(ErrorCode::NotFound, "File not found"));

      std::vector<std::shared_ptr<MessageClazz>> msgs;
      auto jsonLinesRes = IRacingSDK::Utils::ReadTextFile(file_);
      assert(jsonLinesRes.has_value());

      std::istringstream jsonLinesStream(jsonLinesRes.value());


      std::string jsonLine;
      google::protobuf::util::JsonParseOptions jsonParseOptions{};

      while (std::getline(jsonLinesStream, jsonLine)) {
        auto msg = std::make_shared<MessageClazz>();
        ;

        if (!jsonLine.starts_with("{") || !jsonLine.ends_with("}")) {
          L->warn("Invalid json line, skipping remainder: {}", jsonLine);
          break;
        }
        auto jsonParseRes = JsonStringToMessage(jsonLine, msg.get(), jsonParseOptions);
        if (!jsonParseRes.ok()) {
          L->warn("Json parse error ({}), skipping remainder: {}", magic_enum::enum_name(jsonParseRes.code()).data(),
                  std::string{jsonParseRes.message()});
          break;
        }

        msgs.push_back(std::move(msg));
      }

      events.onRead.publish(msgs);

      return msgs;
    }

    /**
     * @brief Write the message vector to disk
     * 
     * @param messages 
     * @return std::expected<std::size_t, GeneralError> 
     */
    virtual std::expected<std::size_t, GeneralError> write(const std::vector<std::shared_ptr<MessageClazz>> &messages) {
      std::scoped_lock lock(persistMutex_);

      std::stringstream data{};
      google::protobuf::util::JsonPrintOptions jsonOptions{};
      for (auto &msg: messages) {
        std::string msgStr;

        auto jsonSerializeRes = MessageToJsonString(*msg.get(), &msgStr, jsonOptions);
        if (!jsonSerializeRes.ok()) {
          L->warn("Json serialize error ({}), skipping remainder: {}",
                  magic_enum::enum_name(jsonSerializeRes.code()).data(), std::string{jsonSerializeRes.message()});

          return std::unexpected(GeneralError(
              ErrorCode::General, fmt::format("Serialize error: {}", std::string{jsonSerializeRes.message()})));
        }

        data << msgStr << "\n";
      }

      auto writeRes = IRacingSDK::Utils::WriteTextFile(file_, data.str());
      if (!writeRes) {
        return std::unexpected(
            GeneralError(ErrorCode::General, fmt::format("Failed to write error: {}", writeRes.error().what())));
      }

      events.onWrite.publish(messages);
      return writeRes.value();
    };

    /**
     * @brief Remove/Delete/Clear the underlying data file
     * 
     * @return std::expected<std::size_t, GeneralError> 
     */
    virtual std::optional<GeneralError> clear() {
      std::scoped_lock lock(persistMutex_);
      if (fs::exists(file_)) {
        L->info("Clearing file ({})", file_.string());
        fs::remove(file_);
      }

      return std::nullopt;
    }

    explicit JSONLinesMessageFileHandler(const fs::path &file) : file_(file) {
    }

    virtual ~JSONLinesMessageFileHandler() = default;
  };
}// namespace VRKit::Shared::Utils