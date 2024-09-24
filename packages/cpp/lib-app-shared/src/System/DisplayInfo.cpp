#include <IRacingTools/Shared/System/DisplayInfo.h>

#include <IRacingTools/SDK/Utils/UnicodeHelpers.h>
#include <IRacingTools/Shared/Macros.h>

namespace IRacingTools::Shared::System {
    namespace {
        auto IsSizeIEqual = [](const Models::SizeI& s1, const Models::SizeI& s2) -> bool {
            return s1.width() == s2.width() && s1.height() == s2.height();
        };

        auto IsPositionEqual = [](const Models::PositionI& o1, const Models::PositionI& o2) -> bool {
            return o1.x() == o2.x() && o1.y() == o2.y();
        };

        auto IsRectIEqual = [](const Models::RectI& o1, const Models::RectI& o2) -> bool {
            return IsPositionEqual(o1.position(), o2.position()) && IsSizeIEqual(o1.size(), o2.size());
        };
    }

    std::string DisplayInfo::toString() const {
        return std::format(
            "DisplayInfo:\n Index: {}\n ID: {}\n Name: {}\n Path: {}\n Width: {}\n Height: {}\n"
            "Physical Width: {}\n Physical Height: {}\n dpiX: {}\n dpiY: {}\n Scale: {}\n x: {}\n y: {}\n"
            "Is Primary: {}\n",
            index,
            id,
            name,
            path,
            width,
            height,
            physicalWidth,
            physicalHeight,
            dpiX,
            dpiY,
            scale,
            x,
            y,
            isPrimary ? "Yes" : "No"
        );
    }

    Models::DisplayConfig* DisplayInfo::toModel(Models::DisplayConfig* display) const {
        display->set_id(id);
        display->set_name(name);
        display->set_primary(isPrimary);
        display->set_scale(scale);

        auto physicalSize = display->mutable_physical_size();
        physicalSize->set_width(physicalWidth);
        physicalSize->set_height(physicalHeight);

        {
            auto scaledSize = display->mutable_scaled_size();
            scaledSize->set_width(width);
            scaledSize->set_height(height);
        }

        {
            auto scaledRect = display->mutable_scaled_rect();
            auto scaledSize = scaledRect->mutable_size();
            auto scaledPos = scaledRect->mutable_position();
            scaledSize->set_width(width);
            scaledSize->set_height(height);
            scaledPos->set_x(x);
            scaledPos->set_y(y);
        }
        return display;
    }

    Models::DisplayConfig DisplayInfo::toModel() const {
        Models::DisplayConfig display;
        toModel(&display);
        return display;
    }

    bool DisplayInfo::EqualTo(const Models::DisplayConfig& d1, const Models::DisplayConfig& d2) {
        auto& id1 = d1.id();
        auto scale1 = d1.scale();
        auto& physicalSize1 = d1.physical_size();
        auto& scaledRect1 = d1.scaled_rect();
        auto& id2 = d2.id();
        auto scale2 = d2.scale();
        auto& physicalSize2 = d2.physical_size();
        auto& scaledRect2 = d2.scaled_rect();
        if (d1.primary() != d2.primary() || id1 != id2 || scale1 != scale2 || !IsRectIEqual(scaledRect1, scaledRect2) ||
            !IsSizeIEqual(physicalSize1, physicalSize2)) {
            return false;
        }

        return true;
    }

    bool DisplayInfo::EqualTo(const DisplayInfo& di1, const DisplayInfo& di2) {
        return EqualTo(di1.toModel(), di2.toModel());
    }

    bool operator==(const Models::DisplayConfig& lhs, const Models::DisplayConfig& rhs) {
        return DisplayInfo::EqualTo(lhs, rhs);
    }

    bool operator!=(const Models::DisplayConfig& lhs, const Models::DisplayConfig& rhs) {
        return !(lhs == rhs);
    }

    bool operator==(const DisplayInfo& lhs, const DisplayInfo& rhs) {
        return DisplayInfo::EqualTo(lhs, rhs);
    }

    bool operator!=(const DisplayInfo& lhs, const DisplayInfo& rhs) {
        return !(lhs == rhs);
    }

    bool DisplayInfo::equalTo(const Models::DisplayConfig& display) const {
        return EqualTo(toModel(), display);
    }

    bool DisplayInfoSetup(bool skipAbortOnFailure) {
        auto result = SetProcessDpiAwareness(PROCESS_PER_MONITOR_DPI_AWARE);
        if (result != S_OK && !skipAbortOnFailure)
            check_hresult(result);

        if (result == S_OK) {
            result = SetProcessDpiAwarenessContext(DPI_AWARENESS_CONTEXT_PER_MONITOR_AWARE_V2);
            if (result != S_OK && !skipAbortOnFailure) {
                check_hresult(result);
            }
        }

        return result == S_OK;
    }

    /**
     * @brief Retrieve all display info by enumerating displays
     *
     * @return Either a vector of DisplayInfo instances OR an error
     */
    std::optional<std::vector<DisplayInfo>> GetAllDisplayInfo() {
        DWORD idx = 0;
        DISPLAY_DEVICE displayDevice;
        DEVMODE mode;

        std::vector<DisplayInfo> displays{};

        // initialize displayDevice
        ZeroMemory(&displayDevice, sizeof(displayDevice));
        displayDevice.cb = sizeof(displayDevice);

        // ENUMERATE ALL DISPLAY DEVICES
        while (EnumDisplayDevices(nullptr, idx, &displayDevice, 0)) {
            ZeroMemory(&mode, sizeof(DEVMODE));
            mode.dmSize = sizeof(DEVMODE);

            // GET DISPLAY SETTINGS FROM REGISTRY
            if (!EnumDisplaySettings(displayDevice.DeviceName, ENUM_REGISTRY_SETTINGS, &mode)) {
                spdlog::warn("Store default failed");
                break;
            }

            // SKIP DISPLAY IF NOT ATTACHED
            if (displayDevice.StateFlags & DISPLAY_DEVICE_ATTACHED_TO_DESKTOP) {
                auto pos = mode.dmPosition;
                POINT posTemp{.x = pos.x, .y = pos.y};

                HMONITOR displayHandle = MonitorFromPoint(posTemp, MONITOR_DEFAULTTONULL);
                double scale = 1.0f;
                UINT dpiX{96}, dpiY{96};
                if (displayHandle) {
                    HRESULT dpiRes = GetDpiForMonitor(displayHandle, MDT_EFFECTIVE_DPI, &dpiX, &dpiY);
                    if (dpiRes == S_OK) {
                        scale = static_cast<double>(dpiY) / 96.0;
                    } else {
                        spdlog::warn("Failed to get monitor scale info: {}");
                    }
                }

                displays.emplace_back(
                    DisplayInfo{
                        .index = displays.size(),
                        .id = SDK::Utils::ToUtf8(std::wstring(displayDevice.DeviceKey)),
                        .name = SDK::Utils::ToUtf8(std::wstring(displayDevice.DeviceName)),
                        .path = SDK::Utils::ToUtf8(std::wstring(displayDevice.DeviceString)),
                        .width = static_cast<std::size_t>(std::floor(static_cast<double>(mode.dmPelsWidth) / scale)),
                        .height = static_cast<std::size_t>(std::floor(static_cast<double>(mode.dmPelsHeight) / scale)),
                        .physicalWidth = mode.dmPelsWidth,
                        .physicalHeight = mode.dmPelsHeight,
                        .dpiX = dpiX,
                        .dpiY = dpiY,
                        .scale = scale,
                        .x = static_cast<std::int32_t>(pos.x),
                        .y = static_cast<std::int32_t>(pos.y),
                        .isPrimary = (displayDevice.StateFlags & DISPLAY_DEVICE_PRIMARY_DEVICE) > 0
                    }
                );
            }
            ZeroMemory(&displayDevice, sizeof(displayDevice));
            displayDevice.cb = sizeof(displayDevice);
            idx++;
        }

        return displays;
    }

    std::string DisplayScreenInfo::toString() const {
        std::string output;
        output.append("Screen Information: \n");

        for (const auto& display : displays) {
            output.append(display.toString());
            output.append("\n");
        }

        output.append("X: " + std::to_string(x) + "\n");
        output.append("Y: " + std::to_string(y) + "\n");
        output.append("X Origin Offset: " + std::to_string(xOriginOffset) + "\n");
        output.append("Y Origin Offset: " + std::to_string(yOriginOffset) + "\n");
        output.append("Width: " + std::to_string(width) + "\n");
        output.append("Height: " + std::to_string(height) + "\n");

        return output;
    }

    Models::ScreenConfig* DisplayScreenInfo::toModel(Models::ScreenConfig* screen) const {
        screen->set_id("IMPLEMENT ID SCHEME");
        screen->set_name(screen->id());

        {
            auto size = screen->mutable_size();
            size->set_width(width);
            size->set_height(height);
        }

        {
            auto layout = screen->mutable_layout_display();

            {
                auto origin = layout->mutable_origin();
                origin->set_x(x);
                origin->set_y(y);
            }

            {
                auto offset = layout->mutable_origin_offset();
                offset->set_x(xOriginOffset);
                offset->set_y(yOriginOffset);
            }

            for (auto& info : displays) {
                info.toModel(layout->add_displays());
            }
        }

        return screen;
    }

    Models::ScreenConfig DisplayScreenInfo::toModel() const {
        Models::ScreenConfig screen;
        toModel(&screen);
        return screen;
    }

    bool DisplayScreenInfo::equalTo(const DisplayScreenInfo& other) const {
        auto otherModel = other.toModel();
        return equalTo(otherModel);
    }

    bool DisplayScreenInfo::equalTo(const Models::ScreenConfig& other) const {
        auto screen = toModel();
        if (!IsSizeIEqual(
            screen.size(),
            other.size()
        ))
            return false;


            if (!screen.has_layout_display() || !other.has_layout_display())
                return false;

            auto& layout1 = screen.layout_display();
            auto& layout2 = other.layout_display();

            if (!IsPositionEqual(layout1.origin(), layout2.origin()) || !IsPositionEqual(
                layout1.origin_offset(),
                layout2.origin_offset()
            )) {
                return false;
            }

            auto& displays1 = layout1.displays();
            auto& displays2 = layout2.displays();

            if (displays1.size() != displays2.size())
                return false;

            for (auto i = 0; i < displays1.size(); i++) {
                auto& d1 = displays1.at(i);
                auto& id1 = d1.id();
                auto scale1 = d1.scale();
                auto& physicalSize1 = d1.physical_size();
                auto& scaledRect1 = d1.scaled_rect();
                auto& d2 = displays2.at(i);
                auto& id2 = d2.id();
                auto scale2 = d2.scale();
                auto& physicalSize2 = d2.physical_size();
                auto& scaledRect2 = d2.scaled_rect();
                if (id1 != id2 || scale1 != scale2 || !IsRectIEqual(scaledRect1, scaledRect2) || !IsSizeIEqual(
                    physicalSize1,
                    physicalSize2
                )) {
                    return false;
                }
            }


        return true;
    }

    /**
     * @inheritDoc
     */
    DisplayScreenInfo DisplayScreenInfo::create(const std::vector<DisplayInfo>& displays) {
        RECT screenRect;
        std::optional<DisplayInfo> primaryOpt;
        SetRectEmpty(&screenRect);
        for (auto& d : displays) {
            if (d.isPrimary)
                primaryOpt = d;
            RECT rect = {d.x, d.y, static_cast<LONG>(d.physicalWidth), static_cast<LONG>(d.physicalHeight)};

            UnionRect(&screenRect, &screenRect, &rect);
        }

        assert(primaryOpt.has_value());
        auto primary = primaryOpt.value();
        // ReSharper disable once CppDFAUnusedValue
        auto left = static_cast<std::int32_t>(screenRect.left);

        // ReSharper disable once CppDFAUnusedValue
        auto top = static_cast<std::int32_t>(screenRect.top);

        return DisplayScreenInfo{
            .displays = displays,
            .x = left,
            .y = top,
            .xOriginOffset = primary.x - left,
            .yOriginOffset = primary.y - top,
            .width = static_cast<std::size_t>(screenRect.right),
            .height = static_cast<std::size_t>(screenRect.bottom)
        };
    }


    SDK::Expected<DisplayScreenInfo> DisplayScreenInfo::generate() {
        auto displays = GetAllDisplayInfo();

        if (displays.has_value()) {
            return create(displays.value());
        }

        return SDK::MakeUnexpected<SDK::GeneralError>(SDK::ErrorCode::General, "Unable to get displays");
    }

    std::string VRScreenInfo::toString() const {
        std::stringstream ss;
        ss << "VRScreenInfo{" "scale: " << scale << ", width: " << width << ", height: " << height << "}";
        return ss.str();
    }

    Models::ScreenConfig* VRScreenInfo::toModel(Models::ScreenConfig* screen) const {
        screen->set_id("VR");
        screen->set_name(screen->id());
        {
            auto size = screen->mutable_size();
            size->set_width(width);
            size->set_height(height);
        }

        {
            auto layout = screen->mutable_layout_vr();
            layout->set_scale(1.0);
            {
                auto scaledSize = layout->mutable_scaled_size();
                scaledSize->set_width(1);
                scaledSize->set_height(1);
            }
        }

        return screen;
    }

    /**
     * @brief Convert VRScreenInfo to serializable version
     *
     * @return new `VRScreenInfo` instance
     */
    Models::ScreenConfig VRScreenInfo::toModel() const {
        Models::ScreenConfig screen;
        toModel(&screen);
        return screen;
    }

    bool VRScreenInfo::equalTo(const VRScreenInfo& otherInfo) const {
        auto other = otherInfo.toModel();
        return equalTo(other);
    }

    bool VRScreenInfo::equalTo(const Models::ScreenConfig& other) const {
        auto screen = toModel();
        if (!IsSizeIEqual(
            screen.size(),
            other.size()
        ))
            return false;


        if (!screen.has_layout_vr() || !other.has_layout_vr())
            return false;

        auto& layout1 = screen.layout_vr();
        auto& layout2 = other.layout_vr();

        if (!IsSizeIEqual(layout1.scaled_size(), layout2.scaled_size()) || layout1.scale() != layout2.scale()) {
            return false;
        }

        return true;
    }

    SDK::Expected<VRScreenInfo> VRScreenInfo::generate() {
        return VRScreenInfo{.scale = 1.0, .width = 1, .height = 1};
    }
}
