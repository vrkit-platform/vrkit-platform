
#include <IRacingTools/Shared/Services/Service.h>

namespace IRacingTools::Shared::Services {
    Service::~Service() {
        stop();
        assert(running_.load() == false);
    }

    std::expected<bool, SDK::GeneralError>  Service::init() {
        assert(running_.load() == false);
        spdlog::debug("Service::init default");

        return true;
    }

    std::expected<bool, SDK::GeneralError>  Service::start() {
        spdlog::debug("Service::start default");
        setRunning(true);

        return true;
    }

    void Service::stop() {
        spdlog::debug("Service::stop default");
        setRunning(false);
    }

    void Service::destroy() {
        spdlog::debug("Service::destroy default");
        setRunning(false);
    }

    bool Service::isRunning() {
        return running_;
    }

    void Service::setRunning(bool running) {
        running_ = running;
    }
} // namespace IRacingTools::Shared::Geometry
