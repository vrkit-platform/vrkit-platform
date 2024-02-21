//
// Created by jglanz on 2/17/2024.
//

#pragma once
#include <windows.h>

#include <QtCore>
#include <QtQml>

#include <IRacingTools/SDK/Utils/Singleton.h>

namespace IRacingTools::App {

    class AppSettings : public QSettings, public SDK::Utils::Singleton<AppSettings> {

      Q_OBJECT
      QML_SINGLETON

    public:
      virtual ~AppSettings() = default;

      AppSettings() = delete;

    signals:
      //AppSettings * settings
      void changed();

    private slots:
      void onChanged();


    private:

      explicit AppSettings(token);
      friend SDK::Utils::Singleton<AppSettings>;

    };

  }// namespace App
