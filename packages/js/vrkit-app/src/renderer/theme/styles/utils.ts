// ----------------------------------------------------------------------

import { isNumber, isString } from "@3fv/guard"
import { alpha, px } from "@vrkit-platform/shared-ui"
import { isEmpty, isNotEmpty } from "@vrkit-platform/shared"
import { asOption } from "@3fv/prelude-ts"
export const stylesMode = {
  light: '[data-mui-color-scheme="light"] &',
  dark: '[data-mui-color-scheme="dark"] &'
}

export const mediaQueries = {
  upXs: "@media (min-width:0px)",
  upSm: "@media (min-width:600px)",
  upMd: "@media (min-width:900px)",
  upLg: "@media (min-width:1200px)",
  upXl: "@media (min-width:1536px)"
}

/**
 * Set font family
 */
export function setFont(fontName: string) {
  return `"${fontName}",-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif,"Apple Color Emoji","Segoe UI Emoji","Segoe UI Symbol"`
}

export function getComputedFontSize() {
  return parseFloat(getComputedStyle(document.documentElement).fontSize)
}

/**
 * Converts rem to px
 */
export function remToPx(value: string | number): number {
  return Math.round((isString(value) ? parseFloat(value) : value) * getComputedFontSize())
}

/**
 * Converts px to rem
 */
export function pxToRem(value: number): string {
  return `${value / getComputedFontSize()}rem`
}

/**
 * Responsive font sizes
 */
export function responsiveFontSizes({ sm, md, lg }: { sm: number; md: number; lg: number }) {
  return {
    [mediaQueries.upSm]: { fontSize: pxToRem(sm) },
    [mediaQueries.upMd]: { fontSize: pxToRem(md) },
    [mediaQueries.upLg]: { fontSize: pxToRem(lg) }
  }
}

/**
 * Converts a hex color to RGB channels
 */
export function hexToRgbChannel(hex: string) {
  if (!/^#[0-9A-F]{6}$/i.test(hex)) {
    throw new Error(`Invalid hex color: ${hex}`)
  }

  const r = parseInt(hex.substring(1, 3), 16)
  const g = parseInt(hex.substring(3, 5), 16)
  const b = parseInt(hex.substring(5, 7), 16)

  return `${r} ${g} ${b}`
}

/**
 * Converts a hex color to RGB channels
 */
export function createPaletteChannel(hexPalette: Record<string, string>) {
  const channelPalette: Record<string, string> = {}

  Object.entries(hexPalette).forEach(([key, value]) => {
    channelPalette[`${key}Channel`] = hexToRgbChannel(value)
  })

  return { ...hexPalette, ...channelPalette }
}

/**
 * Color with alpha channel
 */
export function appAlpha(color: string, opacity = 1) {
  return alpha(color, opacity)
  // const unsupported = color.startsWith("#") || color.startsWith("rgb") || color.startsWith("rgba")
  //
  // if (unsupported) {
  //   throw new Error(`[Alpha]: Unsupported color format "${color}".
  //      Supported formats are:
  //      - RGB channels: "0 184 217".
  //      - CSS variables with "Channel" prefix: "var(--palette-common-blackChannel, #000000)".
  //      Unsupported formats are:
  //      - Hex: "#00B8D9".
  //      - RGB: "rgb(0, 184, 217)".
  //      - RGBA: "rgba(0, 184, 217, 1)".
  //      `)
  // }
  //
  // return `rgba(${color} / ${opacity})`
}

export interface BoxShadowArgs {
  offsetX:number | string
  offsetY:number | string
  blurRadius?:number | string
  spreadRadius?:number | string
}

export interface BoxShadowOptions {
  skipAlphaAdjust?: boolean
}

export function createShadow(color: string, inset:boolean, shadows: BoxShadowArgs[], {skipAlphaAdjust = false}: BoxShadowOptions = {}) {
  if (isEmpty(shadows)) {
    shadows.push({
      offsetX: 0,
      offsetY: 2,
      blurRadius: 1,
      spreadRadius: -1
    })
  }
  const prefix = inset ? "inset " : ""
  const alphaIncrement = 0.08
  const check = (value: string | number) => asOption(value)
      .orElse(asOption(0))
      .map(value => isNumber(value) ? px(value) : value)
      .get()
  let value = ""
  let colorAlpha = (alphaIncrement * shadows.length)
  for (const {offsetX, offsetY, blurRadius = 0, spreadRadius = 0} of shadows) {
    const colorValue = skipAlphaAdjust ? color : alpha(color, colorAlpha);
    colorAlpha -= alphaIncrement
    if (isNotEmpty(value)) {
      value += ","
    }
    
    value += `${prefix} ${check(offsetX)} ${check(offsetY)} ${check(blurRadius)} ${check(spreadRadius)} ${colorValue}`
  }
  
  return value
}