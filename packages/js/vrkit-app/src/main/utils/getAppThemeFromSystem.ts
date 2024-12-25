import { nativeTheme } from "electron"
import type { ThemeId } from "@vrkit-platform/shared"
import { ThemeType } from "@vrkit-platform/models"

export function getAppThemeFromSystem(): ThemeId {
  const useDark = nativeTheme.shouldUseDarkColors
  return ThemeType[useDark ? ThemeType.DARK : ThemeType.LIGHT] as ThemeId
}
