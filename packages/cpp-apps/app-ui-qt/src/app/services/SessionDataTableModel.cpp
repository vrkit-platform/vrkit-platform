//
// Created by jglanz on 1/28/2024.
//

#include <QDebug>
#include <QSize>

#include <IRacingTools/SDK/Utils/UnicodeHelpers.h>

#include "../AppState.h"
#include "SessionDataTableModel.h"

namespace IRacingTools::App::Services {

  using namespace IRacingTools::SDK;

  SessionDataModelEvent::SessionDataModelEvent(std::shared_ptr<Shared::SessionDataEvent> dataEvent, QObject *parent) :
      QObject(parent), cars_(dataEvent->cars()) {
  }

  std::vector<Shared::SessionDataEvent::SessionCarState> &SessionDataModelEvent::cars() {
    return cars_;
  }

  SessionDataTableModel::SessionDataTableModel(QObject *parent) : QAbstractTableModel(parent) {
    auto appState = AppState::GetInstance();
    connect(
        appState, &AppState::dataSourceConfigChanged, [&](auto newConfig) {
          onDataSourceConfigChanged(newConfig);
        }
    );
    connect(this, &SessionDataTableModel::sessionDataChanged, this, &SessionDataTableModel::onSessionDataChanged);
  }
  //SessionDataTableModel::SessionDataTableModel(std::shared_ptr<Shared::SessionDataProvider> dataProvider, QObject *parent) :
  //    SessionDataTableModel(parent) {
  //    setDataProvider(dataProvider);
  //}

  void SessionDataTableModel::cleanup() {
    resetDataProvider();
  }

  void SessionDataTableModel::resetDataProvider() {
    std::lock_guard<std::recursive_mutex> lock(dataProviderMutex_);
    if (dataProvider_) {
      dataProvider_->stop();
      dataProvider_.reset();
    }
  }

  void SessionDataTableModel::createDataProvider(const DataSourceConfig &config) {
    std::lock_guard<std::recursive_mutex> lock(dataProviderMutex_);
    resetDataProvider();

    if (dataSourceConfig_->type() == DataSourceConfig::None) {
      qInfo() << "Data source config is None";
      return;
    }

    // Create new provider
    if (dataSourceConfig_->type() == DataSourceConfig::Disk) {
      QString diskFilename = dataSourceConfig_->localFile();
      if (!QFile::exists(diskFilename)) {
        qFatal() << "File does not exist: " << diskFilename;
      }
      auto filename = diskFilename.toStdString();
      dataProvider_ = std::make_shared<IRacingTools::Shared::DiskSessionDataProvider>(filename, filename);
    } else {
      dataProvider_ = std::make_shared<IRacingTools::Shared::LiveSessionDataProvider>();
    }

    // Subscribe
    dataProvider_->subscribe(
        [&](std::shared_ptr<Shared::SessionDataEvent> srcEvent) {
          auto event = QSharedPointer<SessionDataModelEvent>::create(srcEvent);
          emit sessionDataChanged(event);
        }
    );

    // Start
    dataProvider_->start();
  }

  /**
   * @brief Slot for session data event
   *
   * @param event
   */
  void SessionDataTableModel::onSessionDataChanged(QSharedPointer<SessionDataModelEvent> event) {
    std::scoped_lock lock(dataMutex_);
    beginResetModel();
    cars_ = event->cars();
    endResetModel();
  }

  int SessionDataTableModel::rowCount(const QModelIndex &parent) const {
    return cars_.size();
  }

  int SessionDataTableModel::columnCount(const QModelIndex &parent) const {
    return 7;
  }

  QVariant SessionDataTableModel::data(const QModelIndex &index, int role) const {
    auto &car = cars_[index.row()];
    auto data = car.toTuple();
    auto memberIdx = index.column();
    QVariant value(
        memberIdx == 0 ? std::get<0>(data) : memberIdx == 1 ? std::get<1>(data) : memberIdx == 2 ? std::get<2>(data) :
                                                                                  memberIdx == 3 ? std::get<3>(data) :
                                                                                  memberIdx == 4 ? std::get<4>(data) :
                                                                                  memberIdx == 5 ? std::get<5>(data) :
                                                                                  memberIdx == 6 ? std::get<6>(data) : 0
    );
    //    if (memberIdx < 3) {
    //        value = memberIdx == 0 ? car.index :
    //        memberIdx
    //    }
    return value;
  }

  QVariant SessionDataTableModel::headerData(int, Qt::Orientation, int role) const {
    if (role == Qt::SizeHintRole)
      return QSize(1, 1);
    return QVariant();
  }

  void SessionDataTableModel::onDataSourceConfigChanged(const DataSourceConfig *config) {
    std::scoped_lock lock(dataProviderMutex_);

    qDebug() << "Resetting config";
    if (dataSourceConfig_ && config && *config == *dataSourceConfig_.get()) {
      qDebug() << "Same config, no change";
      return;
    }

    resetDataProvider();

    //    if (!config) {
    //      qDebug() << "No new config";
    //
    //    }

    dataSourceConfig_ = config ? std::make_shared<DataSourceConfig>(config->type(), config->url()) : std::make_shared<
        DataSourceConfig>(DataSourceConfig::None, QUrl(""));

    createDataProvider(*dataSourceConfig_.get());
  }

} // namespace IRacingTools::App::Services