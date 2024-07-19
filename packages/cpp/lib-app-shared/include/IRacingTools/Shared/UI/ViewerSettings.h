
#pragma once

#include <magic_enum.hpp>

#include "../SharedAppLibPCH.h"

#include <IRacingTools/SDK/Utils/Literals.h>
#include <IRacingTools/Shared/UI/BaseWindow.h>

namespace IRacingTools::Shared::UI {
    enum class ViewerFillMode {
        Default,
        Checkerboard,
        Transparent,
      };




    enum class ViewerAlignment {
        TopLeft,
        Top,
        TopRight,
        Left,
        Center,
        Right,
        BottomLeft,
        Bottom,
        BottomRight
      };

    consteval size_t ViewerAlignmentsCount() {
        return magic_enum::enum_count<ViewerAlignment>();
    }


    struct ViewerSettings final {
        int windowWidth {768 / 2};
        int windowHeight {1024 / 2};
        int windowX {CW_USEDEFAULT};
        int windowY {CW_USEDEFAULT};

        bool borderless {false};
        bool streamerMode {false};

        ViewerFillMode fillMode {ViewerFillMode::Default};
        ViewerAlignment alignment {ViewerAlignment::Center};

        static ViewerSettings Load();
        void save();

        constexpr auto operator<=>(const ViewerSettings&) const noexcept = default;
    };

    // VRK_DECLARE_SPARSE_JSON(ViewerSettings);
}