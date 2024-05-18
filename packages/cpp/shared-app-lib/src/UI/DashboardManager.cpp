//
// Created by jglanz on 5/1/2024.
//

#include <memory>

#include <IRacingTools/Shared/UI/DashboardManager.h>

namespace IRacingTools::Shared::UI
{
    std::filesystem::path DashboardStorage::GetDashboardsPath() {
        return GetUserDataPath(std::filesystem::path(DashboardsRelativePath));
    }

    std::shared_ptr<DashboardManager> DashboardStorage::getManagerForPath(const std::filesystem::path& path) {
        std::scoped_lock lock(mutex_);

        if (!managers_.contains(path)) {
            managers_[path] = std::make_shared<DashboardManager>(path);
        }

        return managers_[path];


    }

    DashboardManager::DashboardManager(const fs::path& path) : path_(path) {}

    std::vector<fs::path> DashboardManager::listFiles() {
        return {};
    }

    std::vector<Models::UI::Dashboard::DashboardConfig> DashboardManager::list() {
        return {};
    }

    fs::path DashboardManager::generate(
        const std::string& id,
        const std::string& name,
        const fs::path& configBaseName,
        const GenerateOptions& options
    ) {
        return "";
    }
}
