#pragma once

#include <IRacingTools/Shared/SharedAppLibPCH.h>
#include <format>
#include <iostream>

#include <vector>
#include <iostream>
#include <optional>
#include <string>
#include <IRacingTools/Models/Screen.pb.h>
#include <IRacingTools/SDK/ErrorTypes.h>

namespace IRacingTools::Shared::System {
    /**
     * @brief Represents a single monitor at runtime
     */
    struct DisplayInfo {
        std::size_t index{0};
        std::string id{};
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

        Models::UI::Display* toModel(Models::UI::Display* display) const;
        Models::UI::Display toModel() const;

        bool equalTo(const Models::UI::Display& display) const;
        static bool EqualTo(const Models::UI::Display& d1,const Models::UI::Display& d2);
        static bool EqualTo(const DisplayInfo& di1,const DisplayInfo& di2);


    };

    bool operator==(const Models::UI::Display& lhs, const Models::UI::Display& rhs);

    bool operator!=(const Models::UI::Display& lhs, const Models::UI::Display& rhs);

    bool operator==(const DisplayInfo& lhs, const DisplayInfo& rhs);

    bool operator!=(const DisplayInfo& lhs, const DisplayInfo& rhs);

    /**
     * @brief Represents an entire `Screen` (`1..n` displays married together)
     */
    struct DisplayScreenInfo {
        std::vector<DisplayInfo> displays{};

        std::int32_t x{0};
        std::int32_t y{0};

        std::int32_t xOriginOffset{0};
        std::int32_t yOriginOffset{0};

        std::size_t width{0};
        std::size_t height{0};


        std::string toString() const;
        Models::UI::Screen * toModel(Models::UI::Screen* screen) const;
        Models::UI::Screen toModel() const;

        bool equalTo(const DisplayScreenInfo& other) const;
        bool equalTo(const Models::UI::Screen&) const;


        static DisplayScreenInfo create(const std::vector<DisplayInfo>& displays);

        /**
         * @brief Generates the ScreenInfo object.
         *
         * This method generates a ScreenInfo object by retrieving information about all displays.
         *
         * @return Returns an Expected object containing the generated ScreenInfo object if successful,
         *         or an Unexpected object containing an error message if unsuccessful.
         */
        static SDK::Expected<DisplayScreenInfo> generate();
    };

    struct VRScreenInfo {
        double scale{0.0};

        std::size_t width{0};
        std::size_t height{0};

        std::string toString() const;
        Models::UI::Screen * toModel(Models::UI::Screen* screen) const;
        Models::UI::Screen toModel() const;

        bool equalTo(const VRScreenInfo& other) const;
        bool equalTo(const Models::UI::Screen&) const;


        /**
         * @brief Generates the ScreenInfo object.
         *
         * This method generates a ScreenInfo object by retrieving information about all displays.
         *
         * @return Returns an Expected object containing the generated ScreenInfo object if successful,
         *         or an Unexpected object containing an error message if unsuccessful.
         */
        static SDK::Expected<VRScreenInfo> generate();
    };

    template <std::derived_from<std::ostream> S>
    S& operator<<(S& os, const DisplayInfo& displayInfo) {
        os << displayInfo.toString();
        return os;
    }


    /**
     * @brief Configure process awareness of display info (DPI, etc)
     */
    bool DisplayInfoSetup(bool skipAbortOnFailure = false);

    /**
     * @brief Get all attached displays with info
     *
     * @return
     */
    std::optional<std::vector<DisplayInfo>> GetAllDisplayInfo();
}
