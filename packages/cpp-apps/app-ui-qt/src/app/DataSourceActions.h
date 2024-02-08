//
// Created by jglanz on 2/7/2024.
//

#pragma once

#include <QtCore>
#include <QMutex>
#include <QtQml>

#include "DataSourceConfig.h"

namespace IRacingTools::App {

class DataSourceActions : public QObject {
    Q_OBJECT
    QML_SINGLETON
    QML_NAMED_ELEMENT(DataSourceActions)

public:
    DataSourceActions(QObject * parent = nullptr);

    Q_INVOKABLE void changeDataSource(DataSourceConfig::Type type, const QUrl& url = {""});

};

} // namespace App

