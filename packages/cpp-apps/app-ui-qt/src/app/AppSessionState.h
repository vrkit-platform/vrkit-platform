//
// Created by jglanz on 2/7/2024.
//

#pragma once

#include <QMutex>
#include <QtCore>
#include <QtQml>

#include <IRacingTools/Shared/SessionDataProvider.h>

#include "AppSessionConfig.h"

namespace IRacingTools::App {
  using namespace IRacingTools::Shared;

  class AppSessionState : public QObject {
    Q_OBJECT
    Q_PROPERTY(int time READ time NOTIFY timeChanged FINAL)
  public:
    explicit AppSessionState(QObject *parent);

    int time() const;
    void setTime(int time);

  signals:
    void timeChanged();

  private:
    int time_{-1};
  };
}