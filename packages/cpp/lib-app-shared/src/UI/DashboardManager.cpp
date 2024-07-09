//
// Created by jglanz on 5/1/2024.
//

#include <magic_enum.hpp>
#include <memory>
#include <regex>
#include <IRacingTools/SDK/Utils/FileHelpers.h>

#include <IRacingTools/Shared/UI/DashboardManager.h>
#include <google/protobuf/util/json_util.h>
#include <IRacingTools/Shared/System/DisplayInfo.h>

namespace IRacingTools::Shared::UI {

    namespace {
        using namespace google::protobuf::util;
        using namespace Models::UI::Dashboard;
        SDK::Expected<DashboardConfig> LoadDashboardConfigFileInternal(const fs::path& file) {
            if (!exists(file) || is_directory(file)) {
                return std::unexpected(SDK::GeneralError(SDK::ErrorCode::General, std::format("config file not found ({})", file.string())));
            }

            DashboardConfig config;
            auto jsonStrRes = SDK::Utils::ReadTextFile(file);
            if (!jsonStrRes.has_value())
                return std::unexpected(jsonStrRes.error());

            JsonParseOptions jsonParseOptions;
            jsonParseOptions.ignore_unknown_fields = true;
            jsonParseOptions.case_insensitive_enum_parsing = true;
            auto result = JsonStringToMessage(jsonStrRes.value(), &config, jsonParseOptions);

            if (result.ok())
                return config;

            return std::unexpected(SDK::GeneralError(SDK::ErrorCode::General, 
                std::format("protobuf JSON parse error (code={}): {}", 
                magic_enum::enum_name<absl::StatusCode>(result.code()).data(), std::string{result.message()})));
            // SDK::MakeUnexpected<SDK::GeneralError>();
        }
    }

    SDK::Expected<std::string> GetDashboardIdFromFilename(const fs::path& file) {
        auto filename = file.filename().string();
        // if (!IsValidDashboardFilename(filename))
        //     return std::unexpected(SDK::GeneralError(
        //         SDK::ErrorCode::General,
        //         std::format("Extension {} not found on {}",
        //         DashboardManager::DashboardIRTExtension.data(), file.string())));

        auto filenameLen = filename.length();
        auto filenameExtOffset = filenameLen - DashboardManager::DashboardIRTExtensionLength;
        if (filenameExtOffset < 2)
            return std::unexpected(SDK::GeneralError(
                SDK::ErrorCode::General,
                std::format("ID portion of filename must be at least 1 character ({})",
                file.string())));

        auto id = filename.substr(0, filenameExtOffset);
        if (!IsValidDashboardId(id)) {
            return std::unexpected(SDK::GeneralError(
                SDK::ErrorCode::General,
                std::format("Invalid ID ({}) for file ({})",
                id,
                file.string())));
        }

        return id;
    }
    /**
     * @brief Validate a dashboard id is ok to use
     *
     * @param id dashboard id (filename)
     * @return true if `id` is ok for use
     */
    bool IsValidDashboardId(const std::string& id) {
        static const std::regex alphaNumericRegex("^([A-Za-z0-9-_\\.\\s]+)$");

        std::smatch match;

        return !id.empty() && std::regex_match(id, match, alphaNumericRegex);
    }

    bool IsValidDashboardFilename(const fs::path& file) {
        auto idRes = GetDashboardIdFromFilename(file);
        return idRes.has_value();
    }

    std::filesystem::path DashboardStorage::GetDashboardsPath() {
        return GetUserDataPath(std::filesystem::path(DashboardsRelativePath));
    }

    std::shared_ptr<DashboardManager> DashboardStorage::defaultManager() {
        return managerForPath(GetDashboardsPath());
    }

    std::shared_ptr<DashboardManager> DashboardStorage::managerForPath(const std::filesystem::path& path) {
        std::scoped_lock lock(mutex_);

        if (!managers_.contains(path)) {
            managers_[path] = std::shared_ptr<DashboardManager>(new DashboardManager(path));
        }

        return managers_[path];


    }

    DashboardManager::DashboardManager(const fs::path& path) : path_(path) {}

    /**
     * @brief List dashboard files in store
     *
     * @return all valid files in root of store
     */
    std::vector<fs::path> DashboardManager::listFiles() {
        std::filesystem::directory_iterator dirEntries(path_);
        std::vector<fs::path> files{};
        for (auto& file : files) {
            if (IsValidDashboardFilename(file)) {
                files.push_back(file);
            }
        }

        return files;
    }
    //
    // std::vector<fs::path> DashboardManager::listFiles() {
    //     fs::directory_iterator fileIter(path_);
    //     std::vector<fs::path> paths{};
    //     for (auto& file : fileIter) {
    //         auto filename = file.path().string();
    //         auto isValid = filename.ends_with(".dashboard.irt.json");
    //         spdlog::info("Dashboard file={},isValid={}", filename, isValid);
    //         if (isValid)
    //             paths.emplace_back(filename);
    //     }
    //     return paths;
    // }

    fs::path DashboardManager::path() const {
        return path_;
    }

    bool DashboardManager::idExists(const std::string & id) {

        return IsValidDashboardId(id) && fs::exists(resolveFile(id + DashboardIRTExtension.data()));
    }
    bool DashboardManager::fileExists(const fs::path& filename) {
        return fs::exists(resolveFile(filename));
    }

    fs::path DashboardManager::resolveFile(const fs::path& filename) {
        auto file = filename;
        if (!file.is_absolute())
            file = path_ / file;

        return file;
    }

    SDK::Expected<DashboardConfig> DashboardManager::load(const fs::path& filename) {
        if (!IsValidDashboardFilename(filename)) {
            return std::unexpected(SDK::GeneralError(
                std::format("Invalid filename ({})", filename.string())));
        }

auto file = resolveFile(filename);
        return LoadDashboardConfigFileInternal(file);
    }

    std::vector<DashboardState> DashboardManager::list() {
        auto files = listFiles();
        std::vector<DashboardState> dashboards{};
        for (auto & file : files){
            auto configRes = LoadDashboardConfigFileInternal(file);
            if (!configRes) {
                spdlog::warn("Failed to load dashboard config ({}): {}", file.string(), configRes.error().what());
                continue;
            }

            auto idRes = GetDashboardIdFromFilename(file);
            if (!idRes)
                continue;

            dashboards.push_back(DashboardState{idRes.value(), file, configRes.value()});
        }
        return dashboards;
    }

    SDK::Expected<DashboardState> DashboardManager::generate(
        const std::string& id,
        const GenerateOptions& options
    ) {
        if (!IsValidDashboardId(id)) {
            return SDK::MakeUnexpected<SDK::GeneralError>(SDK::ErrorCode::General, "Invalid id ({})", id);
        }

        DashboardConfig config{};
        config.set_description(id);

        if (options.noDisplays && options.noVR) {
            return SDK::MakeUnexpected<SDK::GeneralError>(SDK::ErrorCode::General, "Both VR & Display screen generation are negated, nothing to do");
        }

        if (!options.noDisplays) {
            auto res = System::DisplayScreenInfo::generate();
            if (!res) {
                return std::unexpected(res.error());
            }

            auto screen = config.add_screens();
            res.value().toModel(screen);
        }

        if (!options.noVR) {
            auto res = System::VRScreenInfo::generate();
            if (!res) {
                return std::unexpected(res.error());
            }

            auto screen = config.add_screens();
            res.value().toModel(screen);
        }

        return save(id,config);
    }

    SDK::Expected<DashboardState> DashboardManager::save(const DashboardState& state) {
        return save(state.id, state.config);
    }

    SDK::Expected<DashboardState> DashboardManager::save(
        const std::string& id,
        const DashboardConfig& config
    ) {
        if (!IsValidDashboardId(id))
            return std::unexpected(SDK::GeneralError(std::format("Invalid id {}", id)));

        fs::path filename{id + DashboardIRTExtension.data()};
        auto file = resolveFile(filename);

        spdlog::debug("Prefixing non-absolute path ({}) to ({})", filename.string(), file.string());


        // if (!SDK::Utils::HasFileExtension(filename, ".json")) {
        //     return std::unexpected(SDK::GeneralError(std::format("Invalid filename {}", filename.string())));
        // }

        // TODO: Implement a validation function here
        //   If current file already exists, load the current file and compare `id` fields
        //   If the `id` fields do not match then return error
        std::string json;
        auto status = MessageToJsonString(config, &json);
        auto res = SDK::Utils::WriteTextFile(file, json);
        spdlog::info("Wrote dashboard ({}): {}", file.string(), res.has_value() ? "SUCCESS" : "FAILED");
        if (!res) {
            spdlog::error("Failed to write dashboard ({}): {}", file.string(), res.error().what());
            return std::unexpected(res.error());
        }

        return DashboardState{id, file,config};

    }
}
