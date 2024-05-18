
#include <IRacingTools/SDK/Utils/UnicodeHelpers.h>
#include <IRacingTools/Shared/Macros.h>
#include <IRacingTools/Shared/System/DisplayInfo.h>

namespace IRacingTools::Shared::System {

    std::string DisplayInfo::toString() const {
        return std::format(
            "DisplayInfo:\n"
            "Index: {}\n"
            "Key: {}\n"
            "Name: {}\n"
            "Path: {}\n"
            "Width: {}\n"
            "Height: {}\n"
            "Physical Width: {}\n"
            "Physical Height: {}\n"
            "dpiX: {}\n"
            "dpiY: {}\n"
            "Scale: {}\n"
            "x: {}\n"
            "y: {}\n"
            "Is Primary: {}\n",
            index, key, name, path, width, height, physicalWidth, physicalHeight, dpiX, dpiY, scale, x, y, isPrimary ? "Yes" : "No"
        );
    }

    void DisplayInfoSetup()
    {
        check_hresult(SetProcessDpiAwareness(PROCESS_PER_MONITOR_DPI_AWARE));
        check_hresult(SetProcessDpiAwarenessContext(DPI_AWARENESS_CONTEXT_PER_MONITOR_AWARE_V2));

    }

    std::optional<std::vector<DisplayInfo>> GetAllDisplayInfo()
    {
        DWORD idx = 0;
        DISPLAY_DEVICE displayDevice;
        DEVMODE mode;

        std::vector<DisplayInfo> displays{};

        // initialize displayDevice
        ZeroMemory(&displayDevice, sizeof(displayDevice));
        displayDevice.cb = sizeof(displayDevice);

        // GetMonitorFromDisplayId()
        // get all display devices
        while (EnumDisplayDevices(nullptr, idx, &displayDevice, 0))
        {
            ZeroMemory(&mode, sizeof(DEVMODE));
            mode.dmSize = sizeof(DEVMODE);
            if (!EnumDisplaySettings(displayDevice.DeviceName, ENUM_REGISTRY_SETTINGS, &mode))
            {
                OutputDebugString(L"Store default failed\n");
                break;
            }

            auto isPrimary = (displayDevice.StateFlags & DISPLAY_DEVICE_PRIMARY_DEVICE) > 0;
            if (auto isAttached = (displayDevice.StateFlags & DISPLAY_DEVICE_ATTACHED_TO_DESKTOP) > 0)
            {
                auto pos = mode.dmPosition;
                POINT posTemp{
                    .x = pos.x,
                    .y = pos.y
                };

                HMONITOR displayHandle = MonitorFromPoint(posTemp, MONITOR_DEFAULTTONULL);
                double scale = 1.0f;
                UINT dpiX{96}, dpiY{96};
                if (displayHandle)
                {
                    HRESULT dpiRes = GetDpiForMonitor(displayHandle, MDT_EFFECTIVE_DPI, &dpiX, &dpiY);
                    if (dpiRes == S_OK) // && !scaleIsOk
                    {
                        scale = static_cast<double>(dpiY) / 96.0;
                    }
                    else
                    {
                        std::wcout << L"Failed to get monitor scale info: " << idx << L"\n";
                    }
                }

                displays.emplace_back(DisplayInfo{
                    .index = displays.size(),
                    .key = SDK::Utils::ToUtf8(std::wstring(displayDevice.DeviceKey)),
                    .name = SDK::Utils::ToUtf8(std::wstring(displayDevice.DeviceName)),
                    .path = SDK::Utils::ToUtf8(std::wstring(displayDevice.DeviceString)),
                    .width = mode.dmPanningWidth,
                    .height = mode.dmPanningHeight,
                    .physicalWidth = mode.dmPelsWidth,
                    .physicalHeight = mode.dmPelsHeight,

                    .dpiX = dpiX,
                    .dpiY = dpiY,
                    .scale = scale,

                    .x = static_cast<std::int32_t>(pos.x),
                    .y = static_cast<std::int32_t>(pos.y),
                    .isPrimary = isPrimary
                });
            }
            ZeroMemory(&displayDevice, sizeof(displayDevice));
            displayDevice.cb = sizeof(displayDevice);
            idx++;
        }

        return displays;
    }

    /**
     * @inheritDoc
     */
    ScreenInfo ScreenInfo::create(const std::vector<DisplayInfo>& displays) {
        RECT screenRect;
        SetRectEmpty(&screenRect);
        for (auto& d : displays) {
            RECT rect = {d.x, d.y, static_cast<LONG>(d.physicalWidth), static_cast<LONG>(d.physicalHeight)};

            UnionRect(&screenRect, &screenRect, &rect);
        }

        return ScreenInfo{
            .displays = displays,
            .x = static_cast<std::int32_t>(screenRect.left),
            .y = static_cast<std::int32_t>(screenRect.bottom),
            .width = static_cast<std::size_t>(screenRect.right),
            .height = static_cast<std::size_t>(screenRect.bottom)
        };
    }


    /**
     * @inheritDoc
     */
    SDK::Expected<ScreenInfo> ScreenInfo::generate() {
        auto displays = GetAllDisplayInfo();

        if (displays.has_value()) {
            return create(displays.value());
        }

        return SDK::MakeUnexpected<SDK::GeneralError>(SDK::ErrorCode::General, "Unable to get displays");
    }

    bool operator==(const DisplayInfo& lhs, const DisplayInfo& rhs) {
        return std::tie(
            lhs.index,
            lhs.key,
            lhs.name,
            lhs.path,
            lhs.width,
            lhs.height,
            lhs.physicalWidth,
            lhs.physicalHeight,
            lhs.dpiX,
            lhs.dpiY,
            lhs.scale,
            lhs.x,
            lhs.y,
            lhs.isPrimary
        ) == std::tie(
            rhs.index,
            rhs.key,
            rhs.name,
            rhs.path,
            rhs.width,
            rhs.height,
            rhs.physicalWidth,
            rhs.physicalHeight,
            rhs.dpiX,
            rhs.dpiY,
            rhs.scale,
            rhs.x,
            rhs.y,
            rhs.isPrimary
        );
    }

    bool operator!=(const DisplayInfo& lhs, const DisplayInfo& rhs) { return !(lhs == rhs); }
}
