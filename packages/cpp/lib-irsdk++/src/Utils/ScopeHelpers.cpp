#include <IRacingTools/SDK/Utils/ScopeHelpers.h>

namespace IRacingTools::SDK::Utils {
  ScopedGuard::ScopedGuard(std::function<void()> f) : callback_(f) {
  }

  // Destructors can't/shouldn't throw; if the callback throws, terminate.
  ScopedGuard::~ScopedGuard() noexcept {
    if (!callback_) {
      return;
    }
    (*callback_)();
  }

  void ScopedGuard::abandon() {
    callback_ = {};
  }
}