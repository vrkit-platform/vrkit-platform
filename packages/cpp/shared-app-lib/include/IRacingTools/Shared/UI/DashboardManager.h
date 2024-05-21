#pragma once

#include <IRacingTools/Shared/SharedAppLibPCH.h>
#include <format>

#include <IRacingTools/Models/Dashboard.pb.h>
#include <IRacingTools/SDK/Utils/Singleton.h>
#include <IRacingTools/Shared/FileSystemHelpers.h>

namespace IRacingTools::Shared::UI {
    class DashboardManager;

    class DashboardStorage final : SDK::Utils::Singleton<DashboardStorage> {
        /**
         * @brief Create DashboardManager
         */
        explicit DashboardStorage(token) {};
        friend Singleton;

        std::mutex mutex_{};
        std::map<std::filesystem::path, std::shared_ptr<DashboardManager>> managers_{};

    public:
        static constexpr auto DashboardsRelativePath = "Dashboards";
        static std::filesystem::path GetDashboardsPath();

        std::shared_ptr<DashboardManager> getManagerForPath(const std::filesystem::path& path = GetDashboardsPath());
    };

    class DashboardManager {
        fs::path path_;
        explicit DashboardManager(const fs::path& path);
        friend DashboardStorage;

    public:
        static constexpr auto DashboardIRTExtension = ".dashboard.irt.json";

        struct GenerateOptions {
            bool noVR{false};
            bool noDisplays{false};
        };

        DashboardManager() = delete;

        DashboardManager(const DashboardManager& other) = delete;
        DashboardManager(DashboardManager&& other) = delete;
        DashboardManager& operator=(const DashboardManager& other) = delete;
        DashboardManager& operator=(DashboardManager&& other) = delete;

        /**
         * @brief Load a dashboard configuration
         *
         * @param filename Either the base filename (excluding `.dashboard.irt.json` suffix or absolute)
         * @return A fully hydrated `DashboardConfig` or an error
         */
        SDK::Expected<Models::UI::Dashboard::DashboardConfig> load(const fs::path& filename);

        /**
         * @brief List all files in store path on type `.dashboard.irt.json`
         *
         * @return List all `.dashboard.irt.json` files in the store's path
         */
        std::vector<fs::path> listFiles();

        /**
         * @brief Parse & load all configs & return them
         *
         * @return all available configs
         */
        std::vector<Models::UI::Dashboard::DashboardConfig> list();

        /**
         * @brief Generate a new dashboard config
         * @param id
         * @param options
         * @return
         */
        SDK::Expected<Models::UI::Dashboard::DashboardConfig> generate(const std::string& id, const GenerateOptions& options = GenerateOptions{});


        SDK::Expected<std::pair<fs::path,Models::UI::Dashboard::DashboardConfig>> save(const Models::UI::Dashboard::DashboardConfig& config, const std::optional<fs::path>& filenameOverride = std::nullopt);


    };
}
