/*
 * OpenKneeboard
 *
 * Copyright (C) 2022 Fred Emmott <fred@fredemmott.com>
 *
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License
 * as published by the Free Software Foundation; version 2.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301,
 * USA.
 */

#include <algorithm>
#include <format>
#include <fstream>

#include <IRacingTools/Shared/UI/ViewerSettings.h>

namespace IRacingTools::Shared::UI {
    ViewerSettings ViewerSettings::Load() {
        ViewerSettings ret;
        //
        // const auto path = Filesystem::GetSettingsDirectory() / "Viewer.json";
        // if (std::filesystem::exists(path)) {
        //   std::ifstream f(path.c_str());
        //   nlohmann::json json;
        //   f >> json;
        //   ret = json;
        // }

        return ret;
    }

    void ViewerSettings::save() {
        // const auto dir = Filesystem::GetSettingsDirectory();
        // if (!std::filesystem::exists(dir)) {
        //   std::filesystem::create_directories(dir);
        // }

        // nlohmann::json j;
        // const auto path = Filesystem::GetSettingsDirectory() / "Viewer.json";
        // if (std::filesystem::exists(path)) {
        //   std::ifstream f(path.c_str());
        //   f >> j;
        // }

        // to_json_with_default(j, ViewerSettings {}, *this);
        //
        // std::ofstream f(dir / "Viewer.json");
        // f << std::setw(2) << j << std::endl;
    }

    // #define IT(x) {ViewerAlignment::x, #x},
    NLOHMANN_JSON_SERIALIZE_ENUM(
        ViewerAlignment,
        { { {ViewerAlignment::TopLeft,
        "TopLeft"},
        {ViewerAlignment::Top,
        "Top"},
        {ViewerAlignment::TopRight,
        "TopRight"},
        {ViewerAlignment::Left,
        "Left"},
        {ViewerAlignment::Center,
        "Center"},
        {ViewerAlignment::Right,
        "Right"},
        {ViewerAlignment::BottomLeft,
        "BottomLeft"},
        {ViewerAlignment::Bottom,
        "Bottom"},
        {ViewerAlignment::BottomRight,
        "BottomRight"} }}
    )
    // #undef IT

    NLOHMANN_JSON_SERIALIZE_ENUM(
        ViewerFillMode,
        { {ViewerFillMode::Default,
        "Default"},
        {ViewerFillMode::Checkerboard,
        "Checkerboard"},
        {ViewerFillMode::Transparent,
        "Transparent"},
        }
    )

    // VRK_DEFINE_SPARSE_JSON(
    //   ViewerSettings,
    //   windowWidth,
    //   windowHeight,
    //   windowX,
    //   windowY,
    //   fillMode,
    //   borderless,
    //   streamerMode,
    //   alignment)
} // namespace OpenKneeboard
