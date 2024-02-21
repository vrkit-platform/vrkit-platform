//
// Created by jglanz on 2/5/2024.
//

#pragma once

#include <IRacingTools/SDK/Utils/Singleton.h>
#include <QMutex>
#include <QtCore>
#include <QtQml>

#include "AppSessionConfig.h"

namespace IRacingTools::App {
// WRITE setDataSourceConfig
class AppState : public QObject, public SDK::Utils::Singleton<AppState> {
    Q_OBJECT
    QML_ELEMENT
//    QML_SINGLETON

public:
//    /**
//         * @brief Set singleton instance
//         *
//         * @param instance
//         */
//    static void SetInstance(AppState *instance);

    /**
         * @brief Get singleton instance
         *
         * @return
         */
//    static AppState *GetInstance();
//
//    /**
//         * \brief
//         * \return
//         */
//    static bool IsReady();
//
//    static void AssertReady();


//signals:


private:

    /**
         * @brief Create AppState
         *
         * @param parent
         */
    explicit AppState(token): QObject(nullptr) {};
    friend SDK::Utils::Singleton<AppState>;


};


} // namespace IRacingTools::App
