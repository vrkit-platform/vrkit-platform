//
// Created by jglanz on 2/5/2024.
//

#pragma once

#include <QtCore>
#include <QMutex>
#include <QtQml>

#include "DataSourceConfig.h"

namespace IRacingTools::App {


// WRITE setDataSourceConfig
class AppState : public QObject {
    Q_OBJECT
    Q_PROPERTY(
        DataSourceConfig* dataSourceConfig READ dataSourceConfig NOTIFY dataSourceConfigChanged)
    QML_ELEMENT
    QML_SINGLETON

public:
    /**
     * @brief Set singleton instance
     *
     * @param instance
     */
    static void SetInstance(AppState * instance);

    /**
     * @brief Get singleton instance
     *
     * @return
     */
    static AppState * GetInstance();

    static bool IsReady();

    static void AssertReady();


    /**
     * @brief Create AppState
     *
     * @param parent
     */
    AppState(QObject *parent = nullptr);

    /**
     * @brief DataSource config
     *
     * @return
     */
  Q_INVOKABLE DataSourceConfig* dataSourceConfig();

//    Q_INVOKABLE void setDataSourceConfig(DataSourceConfig::Type type, const QUrl& url);
    Q_INVOKABLE void setDataSourceConfig(QSharedPointer<DataSourceConfig> dataSourceConfig);

signals:
    void dataSourceConfigChanged(const DataSourceConfig *config);

private:

    QSharedPointer<DataSourceConfig> dataSourceConfig_{nullptr};
};

#define ASSERT_APP_STATE_READY AppState::AssertReady()

} // namespace IRacingTools::App
