//
// Created by jglanz on 1/5/2024.
//

#include <IRacingTools/Shared/SharedMemoryStorage.h>
#include <IRacingTools/Models/LapData.pb.h>
#include <iostream>
#include <ostream>

namespace IRacingTools {
namespace Apps {
namespace Shared {

void SharedMemoryStorage::noop() {
  std::cout << "noop" << std::endl;
}
} // Shared
} // Apps
} // IRacingTools