//
// Created by jglanz on 2/16/2024.
//


#pragma once

#include <QtCore>
#include <QList>

#include <IRacingTools/SDK/SessionInfo/SessionInfoMessage.h>
namespace IRacingTools::App::Models {
  template<typename S, typename T>
  QList<T> ToQList(const std::vector<S>& sourceList, QObject * parent = nullptr) {
    QList<T> newList(sourceList.size());
    for (auto& s : sourceList) {
      newList.emplaceBack(T::create(s, parent));
    }

    return newList;
  }
}