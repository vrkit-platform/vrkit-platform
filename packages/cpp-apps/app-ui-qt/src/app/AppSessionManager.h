//
// Created by jglanz on 2/7/2024.
//

#pragma once

#include <QMutex>
#include <QtCore>
#include <QtQml>

#include <IRacingTools/Shared/SessionDataProvider.h>

#include "AppSessionConfig.h"
#include "AppSessionDataEvent.h"
#include "AppSessionState.h"

namespace IRacingTools::App {
using namespace IRacingTools::Shared;


class AppSessionManager : public QObject, public SDK::Utils::Singleton<AppSessionManager> {
    Q_OBJECT
    Q_PROPERTY(
        AppSessionConfig* config READ config NOTIFY configChanged
    )

    Q_PROPERTY(AppSessionState * session READ session NOTIFY sessionChanged FINAL)
    Q_PROPERTY(SessionDataProvider * provider READ provider NOTIFY providerChanged FINAL)
    Q_PROPERTY(bool dataAvailable READ dataAvailable WRITE setDataAvailable NOTIFY dataAvailableChanged FINAL)

//    QML_SINGLETON
//    QML_NAMED_ELEMENT(AppSessionManager)

public:

    virtual ~AppSessionManager();

    Q_INVOKABLE void setConfig(AppSessionConfig::Type type, const QUrl &url = {""});

    SessionDataProvider * provider();

    bool dataAvailable();

    void setDataAvailable(bool dataAvailable);

    AppSessionState * session();

    AppSessionConfig* config();

signals:
    void dataEvent(QSharedPointer<AppSessionDataEvent> event);
    void configChanged(const AppSessionConfig *config);
    void providerChanged(SessionDataProvider * provider);
    void sessionChanged();
    void dataAvailableChanged();


private:
    explicit AppSessionManager(token);
    friend SDK::Utils::Singleton<AppSessionManager>;

    void resetProvider();

    void createProvider();

    void setProvider(QSharedPointer<SessionDataProvider> provider = {nullptr});
    void setConfig(QSharedPointer<AppSessionConfig> config = {nullptr});

    std::atomic_bool stopped_{false};
    std::vector<Shared::SessionDataUpdatedEvent::SessionCarState> cars_{};
    std::mutex dataMutex_{};

    QSharedPointer<AppSessionState> session_;
    QSharedPointer<AppSessionConfig> config_;
    QSharedPointer<SessionDataProvider> provider_{nullptr};

    std::recursive_mutex providerMutex_{};
    std::atomic_bool dataAvailable_{false};

};

} // namespace IRacingTools::App
