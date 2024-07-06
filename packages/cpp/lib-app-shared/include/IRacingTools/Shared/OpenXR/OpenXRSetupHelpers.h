#pragma once

#define XR_USE_GRAPHICS_API_D3D11

#include <IRacingTools/Shared/FileSystemHelpers.h>

#include "../SharedAppLibPCH.h"

namespace IRacingTools::Shared::OpenXR {
    HKEY OpenOrCreateImplicitLayerRegistryKey(HKEY root);

    std::filesystem::path GetOpenXRLayerJSONPath(const std::filesystem::path& directory = GetRuntimeDirectory());
    void EnableOpenXRLayer(HKEY root, const std::filesystem::path& directory = GetRuntimeDirectory());
    void DisableOpenXRLayer(HKEY root, const std::filesystem::path& directory = GetRuntimeDirectory());

    void DisableOpenXRLayers(HKEY root, std::function<bool(std::wstring_view)> predicate);

}
