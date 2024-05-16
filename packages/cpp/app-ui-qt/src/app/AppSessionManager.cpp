//
// Created by jglanz on 2/7/2024.
//

#include "AppSessionManager.h"

#include <IRacingTools/Shared/DiskSessionDataProvider.h>
#include <IRacingTools/Shared/LiveSessionDataProvider.h>

#include "AppSessionDataEvent.h"
#include "AppState.h"

namespace IRacingTools::App {
using namespace IRacingTools::SDK;

AppSessionManager::AppSessionManager(token) :
    QObject(nullptr), session_(QSharedPointer<AppSessionState>::create(this)),
    config_(QSharedPointer<AppSessionConfig>::create(AppSessionConfig::None, QUrl(""), this)) {

  connect(this, &AppSessionManager::dataEvent, this, &AppSessionManager::onDataEvent);
}

AppSessionManager::~AppSessionManager() {
    if (stopped_.exchange(true))
        return;

    resetProvider();
}

/**
   * @inherit
   */
void AppSessionManager::setConfig(AppSessionConfig::Type type, const QUrl &url) {
    setConfig(QSharedPointer<AppSessionConfig>::create(type, url, this));
}

/**
   * @brief Reset/stop the current provider
   */
void AppSessionManager::resetProvider() {
    if (stopped_)
        return;

    std::lock_guard lock(providerMutex_);
    if (provider_) {
        provider_->stop();
        provider_.reset();
    }
}

void AppSessionManager::createProvider() {
    std::lock_guard<std::recursive_mutex> lock(providerMutex_);
    resetProvider();

    if (config_->type() == AppSessionConfig::None || !config_->isValidConfig()) {
        qInfo() << "Data source config is not set or incomplete";
        return;
    }

    // Create new provider
    if (config_->type() == AppSessionConfig::Disk) {
        QString diskFilename = config_->localFile();
        if (!QFile::exists(diskFilename)) {
            qFatal() << "File does not exist: " << diskFilename;
        }
        auto filename = diskFilename.toStdString();
        setProvider(QSharedPointer<DiskSessionDataProvider>::create(filename, filename));
    } else {
        setProvider(QSharedPointer<LiveSessionDataProvider>::create());
    }

    // Subscribe
    provider_->subscribe([&](std::shared_ptr<Shared::SessionDataEvent> srcEvent) {
        if (srcEvent->type() == Shared::SessionDataEventType::Updated) {
            auto srcUpdatedEvent = static_pointer_cast<Shared::SessionDataUpdatedEvent>(srcEvent);
            auto event = QSharedPointer<AppSessionDataEvent>::create(srcUpdatedEvent);

            emit dataEvent(event);
        } else if (srcEvent->type() == Shared::SessionDataEventType::Available) {
            auto isAvailable = provider_->isAvailable();
            setDataAvailable(isAvailable);
        }
    });

    // Start
    provider_->start();


//    emit providerChanged(provider_.get());
}

/**
 * @inherit
 */
IRacingTools::Shared::SessionDataProvider *AppSessionManager::provider() {
    return provider_.get();
}

/**
 * @inherit
 */
void AppSessionManager::setProvider(QSharedPointer<SessionDataProvider> provider) {
    provider_ = std::move(provider);
    emit providerChanged(provider_.get());
}

/**
 * @inherit
 */
bool AppSessionManager::dataAvailable() {
    return dataAvailable_;
}

/**
 * @inherit
 */
void AppSessionManager::setDataAvailable(bool dataAvailable) {
    if (dataAvailable != dataAvailable_) {
        dataAvailable_ = dataAvailable;
        emit dataAvailableChanged();
    }
}

/**
 * @inherit
 */
AppSessionState *AppSessionManager::session() {
    return session_.get();
}

/**
 * @inherit
 */
AppSessionConfig *AppSessionManager::config() {
    return config_.get();
}

/**
 * @inherit
 */
void AppSessionManager::setConfig(QSharedPointer<AppSessionConfig> config) {
    if (!config_ || *(config_.get()) != config.get()) {
        config_ = std::move(config);
        emit configChanged(config_.get());

        createProvider();
    }
}
void AppSessionManager::onDataEvent(QSharedPointer<AppSessionDataEvent> event) {
  if (auto it = session()) {
    it->setTime(event->time());
    if (auto info = event->sessionInfo().lock())
      it->setInfo(info);
    //              if (auto info = event->sessionInfo().lock()) {
    //                it->setInfo(info);
    //              }
  }

}

} // namespace IRacingTools::App