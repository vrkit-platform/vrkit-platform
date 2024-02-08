//
// Created by jglanz on 2/5/2024.
//

#include "AppState.h"

namespace IRacingTools::App {

  namespace {
    AppState *gAppStateInstance{nullptr};
    QMutex gAppStateInstanceMutex{};
  } // namespace

  /**
   * @inherit
   */
  AppState::AppState(QObject *parent) : QObject(parent) {
    setDataSourceConfig(
        QSharedPointer<DataSourceConfig>::create(DataSourceConfig::None, QUrl(""), this));

  }

  /**
   * @inherit
   */
  DataSourceConfig *AppState::dataSourceConfig() {
    return dataSourceConfig_.get();
  }

  /**
   * @inherit
   */
  void AppState::setDataSourceConfig(QSharedPointer<DataSourceConfig> dataSourceConfig) {
    if (!dataSourceConfig_ || *dataSourceConfig_.get() != *dataSourceConfig.get()) {

      dataSourceConfig_ = dataSourceConfig;
      emit dataSourceConfigChanged(dataSourceConfig_.get());
    }
  }

  /**
   * @inherit
   */
  AppState *AppState::GetInstance() {
    return gAppStateInstance;
  }

  /**
   * @inherit
   */
  void AppState::SetInstance(AppState *instance) {
    QMutexLocker lock(&gAppStateInstanceMutex);

    Q_ASSERT(!gAppStateInstance);
    gAppStateInstance = instance;
  }

  /**
   * @inherit
   */
  bool AppState::IsReady() {
    QMutexLocker lock(&gAppStateInstanceMutex);
    return gAppStateInstance;
  }

  /**
   * @inherit
   */
  void AppState::AssertReady() {
    QMutexLocker lock(&gAppStateInstanceMutex);
    Q_ASSERT(gAppStateInstance);
  }
} // namespace IRacingTools::App
