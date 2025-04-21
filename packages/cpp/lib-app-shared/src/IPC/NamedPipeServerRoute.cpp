#include <IRacingTools/Shared/IPC/NamedPipeServerRoute.h>

namespace IRacingTools::Shared::IPC {
  NamedPipeServerRoute::NamedPipeServerRoute(const std::string& matchExpression)
      : matchExpression_(matchExpression),
        matcher_(matchExpression.empty() ? ".*" : matchExpression) {
  }

  bool NamedPipeServerRoute::accepts(const std::string& path) {
    return std::regex_match(path, matcher_);
  }
}