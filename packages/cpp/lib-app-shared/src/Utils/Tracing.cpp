#include <IRacingTools/Shared/Tracing.h>

namespace IRacingTools::Shared {
  TRACELOGGING_DEFINE_PROVIDER(
      gTracingProvider,                     // Handle to the provider
      "VRKIT.CPP",                   // Unique provider name
      // GUID generated uniquely for this provider (use a GUID generator tool like guidgen)
      // 6dbc9382-5c72-4bf0-9c01-6bf49f7ebe2a
      (0x6dbc9382, 0x5c72, 0x4bf0, 0x9c, 0x01, 0x6b, 0xf4, 0x9f, 0x7e, 0xbe, 0x2a)
  );
}