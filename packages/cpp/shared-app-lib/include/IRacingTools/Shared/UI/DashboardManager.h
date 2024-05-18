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
        struct GenerateOptions {
            bool noVR{false};
            bool noDisplays{false};
        };

        DashboardManager() = delete;

        DashboardManager(const DashboardManager& other) = delete;
        DashboardManager(DashboardManager&& other) = delete;
        DashboardManager& operator=(const DashboardManager& other) = delete;
        DashboardManager& operator=(DashboardManager&& other) = delete;

        std::vector<fs::path> listFiles();
        std::vector<Models::UI::Dashboard::DashboardConfig> list();
        fs::path generate(const std::string& id, const std::string& name = id, const fs::path& configBaseName = fs::path(id), const GenerateOptions& options = GenerateOptions{});
    };
}
