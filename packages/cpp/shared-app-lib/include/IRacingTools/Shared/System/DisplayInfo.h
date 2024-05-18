#pragma once

#include <IRacingTools/Shared/SharedAppLibPCH.h>
#include <format>
#include <iostream>

#include <vector>
#include <iostream>
#include <optional>
#include <string>

namespace IRacingTools::Shared::System {
    /**
     * @brief Represents a single monitor at runtime
     */
    struct DisplayInfo {
        std::size_t index{0};
        std::string key{};
        std::string name{};
        std::string path{};

        std::size_t width{0};
        std::size_t height{0};

        std::size_t physicalWidth{0};
        std::size_t physicalHeight{0};

        std::uint32_t dpiX{0};
        std::uint32_t dpiY{0};
        double scale{1.0f};
        std::int32_t x{0};
        std::int32_t y{0};

        bool isPrimary{false};

        std::string toString() const;
    };

    struct ScreenInfo {
        std::vector<DisplayInfo> displays{};

        std::int32_t x{0};
        std::int32_t y{0};

        std::size_t width{0};
        std::size_t height{0};

        static ScreenInfo create(const std::vector<DisplayInfo>& displays);

        /**
         * @brief Generates the ScreenInfo object.
         *
         * This method generates a ScreenInfo object by retrieving information about all displays.
         *
         * @return Returns an Expected object containing the generated ScreenInfo object if successful,
         *         or an Unexpected object containing an error message if unsuccessful.
         */
        static SDK::Expected<ScreenInfo> ScreenInfo::generate();
    };


    bool operator==(const DisplayInfo& lhs, const DisplayInfo& rhs);

    bool operator!=(const DisplayInfo& lhs, const DisplayInfo& rhs);

    template <std::derived_from<std::ostream> S>
    S& operator<<(S& os, const DisplayInfo& displayInfo) {
        os << displayInfo.toString();
        return os;
    }


    /**
     * @brief Configure process awareness of display info (DPI, etc)
     */
    void DisplayInfoSetup();

    /**
     * @brief Get all attached displays with info
     *
     * @return
     */
    std::optional<std::vector<DisplayInfo>> GetAllDisplayInfo();
}
