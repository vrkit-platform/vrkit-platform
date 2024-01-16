//
// Created by jglanz on 1/5/2024.
//

#include <IRacingTools/Models/LapData.pb.h>
#include <IRacingTools/Shared/SharedMemoryStorage.h>
#include <iostream>
#include <ostream>

namespace IRacingTools::Shared {

void SharedMemoryStorage::noop() {
    std::cout << "noop" << std::endl;
}
} // namespace IRacingTools::Shared
