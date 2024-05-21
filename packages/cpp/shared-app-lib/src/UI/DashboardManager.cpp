//
// Created by jglanz on 5/1/2024.
//

#include <magic_enum.hpp>
#include <memory>
#include <IRacingTools/SDK/Utils/FileHelpers.h>

#include <IRacingTools/Shared/UI/DashboardManager.h>
#include <google/protobuf/util/json_util.h>

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

            return std::unexpected(SDK::GeneralError(SDK::ErrorCode::General, std::format("protobuf JSON parse error (code={}): {}", magic_enum::enum_name<StatusCode>(result.code()).data(), result.message().as_string())));
            // SDK::MakeUnexpected<SDK::GeneralError>();
        }
    }

    std::filesystem::path DashboardStorage::GetDashboardsPath() {
        return GetUserDataPath(std::filesystem::path(DashboardsRelativePath));
    }

    std::shared_ptr<DashboardManager> DashboardStorage::getManagerForPath(const std::filesystem::path& path) {
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
            if (SDK::Utils::HasFileExtension(file, DashboardIRTExtension)) {
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

    SDK::Expected<DashboardConfig> DashboardManager::load(const fs::path& filename) {
        auto isValidDashboardFilename = [] (const fs::path& file) -> bool {
            return SDK::Utils::HasFileExtension(file,".json") && exists(file) && !is_directory(file);
        };
        auto base = filename.filename().string();
        std::vector<fs::path> names {
            base,
            base + DashboardIRTExtension,
            base + ".irt.json",
            base + ".json",
        };
        std::vector dirs {
            filename,
            filename.parent_path(),
            fs::current_path(),
            path_ / filename,
            path_ / filename.parent_path(),
        };

        auto allFiles = std::accumulate(dirs.begin(), dirs.end(), std::vector<fs::path>{}, [&names, &isValidDashboardFilename](auto files, auto& dir) {
            for (auto& name : names) {
                auto file = dir / name;
                if (isValidDashboardFilename(file)) {
                    files.push_back(file);
                }
            }

            return files;
        });

        if (allFiles.empty()) {
            return std::unexpected(SDK::GeneralError(
                std::format("No valid files found with filename ({}) in store ({})", filename.string(), path_.string())));
        }

        return LoadDashboardConfigFileInternal(allFiles.front());
    }

    std::vector<DashboardConfig> DashboardManager::list() {
        auto files = listFiles();
        // std::accumulate(files.begin(), files.end(), std::vector<DashboardConfig>{}, [&] (auto& configs, auto& file) {
        //             // TODO: Implement loading
        //             return configs;
        //         });
        return {};
    }

    SDK::Expected<DashboardConfig> DashboardManager::generate(
        const std::string& id,
        const GenerateOptions& options
    ) {
        return DashboardConfig{};
    }

    SDK::Expected<std::pair<fs::path, DashboardConfig>> DashboardManager::save(
        const DashboardConfig& config,
        const std::optional<fs::path>& filenameOverride
    ) {
        fs::path filename = filenameOverride.has_value() ? filenameOverride.value() : (config.id() + DashboardIRTExtension);
        if (!filename.is_absolute()) {
            auto absFilename = path_ / filename;
            spdlog::debug("Prefixing non-absolute path ({}) to ({})", filename.string(), absFilename.string());
            filename = absFilename;
        }

        if (!SDK::Utils::HasFileExtension(filename, ".json")) {
            return std::unexpected(SDK::GeneralError(std::format("Invalid filename {}", filename.string())));
        }

        // TODO: Implement a validation function here
        //   If current file already exists, load the current file and compare `id` fields
        //   If the `id` fields do not match then return error
        std::string json;
        auto status = MessageToJsonString(config, &json);
        return std::make_pair(filename,DashboardConfig{});

    }
}
