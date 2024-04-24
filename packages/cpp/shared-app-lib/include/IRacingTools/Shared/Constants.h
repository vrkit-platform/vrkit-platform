//
// Created by jglanz on 4/24/2024.
//

#pragma once


#include "Geometry2D.h"

namespace IRacingTools::Shared {
  using namespace Geometry2D;

  constexpr unsigned int SHMSwapchainLength = 2;
  constexpr PixelSize MaxViewRenderSize{2048, 2048};
  constexpr PixelSize ErrorRenderSize{768, 1024};
  constexpr unsigned char MaxViewCount = 16;
  constexpr unsigned int FramesPerSecond = 90;

  constexpr const char ProjectReverseDomainA[] {"com.irt"};
  constexpr const wchar_t ProjectReverseDomainW[] {L"com.irt"};
}