import { appAlpha } from "../styles"
import { common, error, grey, info, primary, secondary, success, warning } from "./palette"

import type { ThemeColorScheme } from "../ThemeTypes" // ----------------------------------------------------------------------

// ----------------------------------------------------------------------

export interface CustomShadows {
  z1?: string

  z4?: string

  z8?: string

  z12?: string

  z16?: string

  z20?: string

  z24?: string

  //
  primary?: string

  secondary?: string

  info?: string

  success?: string

  warning?: string

  error?: string

  //
  card?: string

  dialog?: string

  dropdown?: string

  raisedCard?: string
}

declare module "@mui/material/styles" {
  interface Theme {
    customShadows: CustomShadows
  }

  interface ThemeOptions {
    customShadows?: CustomShadows
  }

  interface ThemeVars {
    customShadows: CustomShadows
  }
}

// ----------------------------------------------------------------------

export function createShadowColor(colorChannel: string) {
  return `0 8px 16px 0 ${appAlpha(colorChannel, 0.24)}`
}

export function customShadows(colorScheme: ThemeColorScheme) {
  const colorChannel = colorScheme === "light" ? grey["500"] : common.blackChannel

  return {
    z1: `0 1px 2px 0 ${appAlpha(colorChannel, 0.16)}`,
    z4: `0 4px 8px 0 ${appAlpha(colorChannel, 0.16)}`,
    z8: `0 8px 16px 0 ${appAlpha(colorChannel, 0.16)}`,
    z12: `0 12px 24px -4px ${appAlpha(colorChannel, 0.16)}`,
    z16: `0 16px 32px -4px ${appAlpha(colorChannel, 0.16)}`,
    z20: `0 20px 40px -4px ${appAlpha(colorChannel, 0.16)}`,
    z24: `0 24px 48px 0 ${appAlpha(colorChannel, 0.16)}`, //
    dialog: `-40px 40px 80px -8px ${appAlpha(common.blackChannel, 0.24)}`,
    card: `0 0 2px 0 ${appAlpha(colorChannel, 0.2)}, 0 12px 24px -4px ${appAlpha(colorChannel, 0.12)}`,
    dropdown: `0 0 2px 0 ${appAlpha(colorChannel, 0.24)}, -20px 20px 40px -4px ${appAlpha(colorChannel, 0.24)}`, //
    primary: createShadowColor(primary.main),
    secondary: createShadowColor(secondary.main),
    info: createShadowColor(info.main),
    success: createShadowColor(success.main),
    warning: createShadowColor(warning.main),
    error: createShadowColor(error.main),

    raisedCard: `7px 7px 4px -1px ${appAlpha(colorChannel, 0.02)},` +
        `0px 4px 5px 0px ${appAlpha(colorChannel,0.14)},` +
        `0px 1px 10px 0px ${appAlpha(colorChannel, 0.12)}`
  }
}
