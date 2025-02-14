//
// Created by jglanz on 4/24/2024.
//

#pragma once


#include <IRacingTools/Shared/Geometry2D.h>

namespace IRacingTools::Shared {


  constexpr std::uint32_t SHMSwapchainLength = 2;
  constexpr PixelSize MaxViewRenderSize{2048, 2048};
  constexpr PixelSize ErrorRenderSize{768, 1024};

  constexpr std::uint8_t MaxViewCount = 8;
  constexpr std::uint32_t FramesPerSecond = 90;

  #define PROJECT_REVERSE_DOMAIN "com.irt"

  constexpr std::int64_t MaxFrameIntervalMillis = 1000;

  constexpr char ProjectReverseDomainA[] {PROJECT_REVERSE_DOMAIN};
  constexpr wchar_t ProjectReverseDomainW[] {L"" PROJECT_REVERSE_DOMAIN};

#if defined(_DEBUG) || defined(DEBUG)
  constexpr bool DebugEnabled = true;
#else
  constexpr bool DebugEnabled = false;
#endif
}