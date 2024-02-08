//
// Created by jglanz on 2/7/2024.
//

#include "DataSourceActions.h"
#include "AppState.h"

namespace IRacingTools::App {

  DataSourceActions::DataSourceActions(QObject *parent) : QObject(parent) {
  }

  void DataSourceActions::changeDataSource(DataSourceConfig::Type type, const QUrl &url) {
    auto appState = AppState::GetInstance();
    auto newConfig = QSharedPointer<DataSourceConfig>::create(type, url, appState);
    if (!newConfig->isValidConfig()) {
      qmlEngine(this)->throwError(tr("Invalid data config"));
      return;
    }

    appState->setDataSourceConfig(newConfig);
  }
} // namespace IRacingTools::App