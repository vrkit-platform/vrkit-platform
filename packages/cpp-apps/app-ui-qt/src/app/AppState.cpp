//
// Created by jglanz on 2/5/2024.
//

#include "AppState.h"

namespace IRacingTools::App {
DataSourceConfig* AppState::dataSourceConfig() {
    return dataSourceConfig_;
}
void AppState::setDataSourceConfig( DataSourceConfig* dataSourceConfig) {
    if (dataSourceConfig_ != dataSourceConfig) {
        dataSourceConfig_ = dataSourceConfig;
                                //.setUrl(dataSourceConfig.url());
//        dataSourceConfig_.setType(dataSourceConfig.type());
        emit dataSourceConfigChanged();
    }
}
AppState::AppState(QObject *parent) : QObject(parent), dataSourceConfig_(new DataSourceConfig(DataSourceConfig::Live, QUrl(""),parent)){}
} // namespace IRacingTools::App
