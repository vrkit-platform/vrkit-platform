import { nativeTheme } from "electron"
import { THEMES, ThemeId } from "vrkit-app-common/models"

export function getAppThemeFromSystem(): ThemeId {
  const useDark = nativeTheme.shouldUseDarkColors,
    theme: ThemeId = useDark ? THEMES.DARK : THEMES.LIGHT

  return theme
}
