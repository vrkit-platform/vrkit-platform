import { nativeTheme } from "electron"
import type { ThemeId } from "vrkit-app-common/models"
import { ThemeType } from "vrkit-models"

export function getAppThemeFromSystem(): ThemeId {
  const useDark = nativeTheme.shouldUseDarkColors
  return ThemeType[useDark ? ThemeType.DARK : ThemeType.LIGHT] as ThemeId
}
