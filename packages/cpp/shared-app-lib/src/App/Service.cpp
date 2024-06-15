
#include <IRacingTools/Shared/App/Service.h>

namespace IRacingTools::Shared {
    Service::~Service() {
        stop();
        assert(running_ == false);
    }

    void Service::init() {
        assert(running_ == false);
        spdlog::debug("Service::init default");
    }

    void Service::start() {
        spdlog::debug("Service::start default");
        setRunning(true);
    }

    void Service::stop() {
        spdlog::debug("Service::stop default");
        setRunning(false);
    }

    bool Service::isRunning() {
        return running_;
    }

    void Service::setRunning(bool running) {
        running_ = running;
    }
} // namespace IRacingTools::Shared::Geometry
