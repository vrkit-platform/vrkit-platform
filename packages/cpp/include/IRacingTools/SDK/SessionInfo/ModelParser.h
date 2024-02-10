//
// Created by jglanz on 2/10/2024.
//

#pragma once

#include <yaml-cpp/yaml.h>

#include "SessionInfoMessage.h"

namespace YAML {
  using namespace IRacingTools::SDK::SessionInfo;

  template<>
  struct convert<WeekendInfo> {
    static Node encode(const WeekendInfo& rhs) {
      Node node;
      node["TrackName"] = rhs.trackName;
      return node;
    }

    static bool decode(const Node& node, WeekendInfo& rhs) {
      rhs.trackName = node["TrackName"].as<std::string>();
      return true;
    }
  };

  template<>
  struct convert<SessionInfoMessage> {
    static Node encode(const SessionInfoMessage& rhs) {
      Node node;
      node["WeekendInfo"] = rhs.weekendInfo;
      return node;
    }

    static bool decode(const Node& node, SessionInfoMessage& rhs) {
      rhs.weekendInfo = node["WeekendInfo"].as<WeekendInfo>();
      return true;
    }
  };
}