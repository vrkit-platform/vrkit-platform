#pragma once


#include <deque>
#include <future>
#include <memory>
#include <mutex>
#include <optional>
#include <thread>
#include <type_traits>
#include <vector>

#include <boost/uuid/uuid.hpp>
#include <boost/uuid/uuid_generators.hpp>

namespace IRacingTools::Shared::Common {

std::string NewUUID() {
  auto uuid = boost::uuids::random_generator()();

  return std::string(uuid.begin(), uuid.end());
  }
}