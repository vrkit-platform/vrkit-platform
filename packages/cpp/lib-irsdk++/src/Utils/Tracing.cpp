#include <IRacingTools/SDK/Utils/Tracing.h>

TRACELOGGING_DEFINE_PROVIDER(
    gTracingProvider,                     // Handle to the provider
    "VRKit.App",                   // Unique provider name
    // GUID generated uniquely for this provider (use a GUID generator tool like guidgen)
    (0xd236f7f9, 0xa1e8, 0x4e78, 0x9b, 0x2a, 0x3c, 0x14, 0x21, 0x43, 0x81, 0x78)
);
