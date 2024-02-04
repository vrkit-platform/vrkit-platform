//
// Created by jglanz on 1/28/2024.
//

#pragma once

#include <windows.h>

#include <QThread>
#include <QtQml/qqml.h>

#include <IRacingTools/SDK/LiveClient.h>
#include <IRacingTools/SDK/LiveConnection.h>
#include <IRacingTools/SDK/Types.h>
#include <IRacingTools/SDK/VarHolder.h>

#include <IRacingTools/Shared/SessionDataProvider.h>
#include <QAbstractEventDispatcher>
#include <QEventLoop>
#include <QAbstractTableModel>

namespace IRacingTools {
namespace App {
namespace Services {

class SessionDataModelEvent : public QObject {
    Q_OBJECT
public:
    explicit SessionDataModelEvent(std::shared_ptr<Shared::SessionDataEvent> dataEvent, QObject * parent = nullptr);
    std::vector<Shared::SessionDataEvent::SessionCarState>& cars();


private:
    std::vector<Shared::SessionDataEvent::SessionCarState> cars_{};
};

/**
 * @brief IRacing Data Service
 */
class SessionDataTableModel : public QAbstractTableModel {
    Q_OBJECT
    QML_ELEMENT

//signals:
//    [[maybe_unused]] void sessionUpdated(IRSessionUpdateEvent& ev);
//    void dataEventReceived();
signals:
    void sessionDataChanged(QSharedPointer<SessionDataModelEvent> event);

private slots:
    void onSessionDataChanged(QSharedPointer<SessionDataModelEvent> event);

public:
    explicit SessionDataTableModel(QObject * parent = nullptr);
    explicit SessionDataTableModel(std::shared_ptr<Shared::SessionDataProvider> dataProvider, QObject * parent = nullptr);

    void resetDataProvider();

    void setDataProvider(std::shared_ptr<Shared::SessionDataProvider> dataProvider);

    int rowCount(const QModelIndex &parent = QModelIndex()) const override;
    int columnCount(const QModelIndex &parent = QModelIndex()) const override;

    QVariant data(const QModelIndex &index, int role = Qt::DisplayRole) const override;

    QVariant headerData(int /* section */, Qt::Orientation /* orientation */,
                        int role) const override;


private:
    void cleanup();

    std::vector<Shared::SessionDataEvent::SessionCarState> cars_{};
    std::mutex dataMutex_{};

    std::mutex dataProviderMutex_{};
    std::shared_ptr<Shared::SessionDataProvider> dataProvider_{nullptr};
//    HANDLE dataValidEvent_{nullptr};
};

} // namespace Services
} // namespace App
} // namespace IRacingTools
