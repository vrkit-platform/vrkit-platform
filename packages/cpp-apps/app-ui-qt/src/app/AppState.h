//
// Created by jglanz on 2/5/2024.
//

#pragma once

#include <QtCore>
#include <QtQml>

#include "DataSourceConfig.h"

namespace IRacingTools::App {

class AppState : public QObject {
    Q_OBJECT
    Q_PROPERTY(
        DataSourceConfig* dataSourceConfig READ dataSourceConfig WRITE setDataSourceConfig NOTIFY dataSourceConfigChanged)
    QML_ELEMENT
    QML_SINGLETON

public:
    AppState(QObject *parent = nullptr);

    DataSourceConfig* dataSourceConfig();
    void setDataSourceConfig(DataSourceConfig* dataSourceConfig);

signals:
    void dataSourceConfigChanged();

private:
    DataSourceConfig *dataSourceConfig_{nullptr};
};

} // namespace IRacingTools::App
