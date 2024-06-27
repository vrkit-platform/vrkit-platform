//
// Created by jglanz on 1/28/2024.
//

#pragma once

#include <windows.h>

#include <QAbstractTableModel>

#include <AppSessionManager.h>
#include <IRacingTools/Shared/SessionDataProvider.h>

#include "../AppSessionConfig.h"
#include "AppSessionDataEvent.h"

namespace IRacingTools::Services {

/**
 * @brief IRacing Data Service
 */
class SessionDataTableModel : public QAbstractTableModel {
    Q_OBJECT
    QML_ELEMENT

private slots:
    void onDataEvent(QSharedPointer<AppSessionDataEvent> event);

public:
    explicit SessionDataTableModel(QObject *parent = nullptr);

    virtual ~SessionDataTableModel();


    int rowCount(const QModelIndex &parent = QModelIndex()) const override;
    int columnCount(const QModelIndex &parent = QModelIndex()) const override;

    QVariant data(const QModelIndex &index, int role = Qt::DisplayRole) const override;
    QVariant headerData(int /* section */, Qt::Orientation /* orientation */, int role) const override;

private:

    std::vector<Shared::SessionDataUpdatedDataEvent::SessionCarState> cars_{};

    //    HANDLE dataValidEvent_{nullptr};
};

} // namespace IRacingTools::Services
