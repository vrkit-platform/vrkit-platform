import type { ValuesOf } from 'vrkit-app-common/utils';
export const THEMES = {
  LIGHT: "LIGHT",
  DARK: "DARK"
}

export type ThemeId = ValuesOf<typeof THEMES> | "AUTO"
