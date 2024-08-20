import { Property } from "csstype"
import { capitalize } from "lodash"

export type ColorProperty = Property.Color
export type Contrast = "light" | "dark" | "brown"

export interface PaletteColorConfig {
  "50": ColorProperty
  "100": ColorProperty
  "200": ColorProperty
  "300": ColorProperty
  "400": ColorProperty
  "500": ColorProperty
  "600": ColorProperty
  "700": ColorProperty
  "800": ColorProperty
  "900": ColorProperty
  A100: ColorProperty
  A200: ColorProperty
  A400: ColorProperty
  A700: ColorProperty
  light: ColorProperty
  main: ColorProperty
  dark: ColorProperty
  contrastDefaultColor: Contrast
  contrastText: ColorProperty
}

export interface PaletteColorConfigText {
  primary: ColorProperty
  secondary: ColorProperty
  disabled: ColorProperty
  hint: ColorProperty
  icon: ColorProperty
}

export interface PaletteColorConfigAction {
  active: ColorProperty
  hover: ColorProperty
  hoverOpacity: number
  selected: ColorProperty
  selectedOpacity: number
  disabled: ColorProperty
  disabledBackground: ColorProperty
  disabledOpacity: number
  focus: ColorProperty
  focusOpacity: number
  activatedOpacity: number
}

export interface PaletteColorConfigBackground {
  default: ColorProperty
  paper: ColorProperty
  level1: ColorProperty
  level2: ColorProperty
}

export type ColorIntensity = string &
  keyof PaletteColorConfig
export type ColorIntensityClassKey =
  ColorClassKey<ColorIntensity>
export type ColorClassKey<T> = T extends string
  ? `color${Capitalize<T>}`
  : never

// export type ColorClassKey<C extends Color = Color, IntensityKey extends keyof C & string = keyof
// C & string> = `color${uppercase(IntensityKey)}`

export interface CodeColors {
  background: ColorProperty
  text: ColorProperty
  comment: ColorProperty
  keyword: ColorProperty
  section: ColorProperty
  literal: ColorProperty
  string: ColorProperty
  class: ColorProperty
  variable: ColorProperty
  symbol: ColorProperty
}

export type ColorVariant = keyof PaletteColorConfig
export type PaletteDefault = "light" | "main" | "dark"

export type PaletteType = "light" | "dark"

//export type ColorVariant = PaletteAttribute

export interface PaletteColors {
  primary: PaletteColorConfig
  secondary: PaletteColorConfig
  ok: PaletteColorConfig
  background: PaletteColorConfigBackground
  text: PaletteColorConfigText
  // textNight: PaletteColorConfig
  action: PaletteColorConfigAction
  //focus: PaletteColorConfig
  divider: ColorProperty
  verbose: PaletteColorConfig
  success: PaletteColorConfig
  warn: PaletteColorConfig
  error: PaletteColorConfig
  open: PaletteColorConfig
  closed: PaletteColorConfig
  notifications: PaletteColorConfig
  pr: PaletteColorConfig
  border: PaletteColorConfig
}

export interface Palette extends PaletteColors {
  //extends Omit<MUIPalette, "action"> {

  type: PaletteType
  name: string
  description: string
  // mode: "light" | "dark"
  code: CodeColors
}

export type PaletteOptions = Partial<Palette>

export type PaletteColor = string & keyof PaletteColors //<P extends keyof Palette = keyof Palette>
// = (Palette[P] extends Color ? Color :
// never)

export type PaletteName = PaletteColor

export type PaletteClassKey =
  `color${Capitalize<PaletteName>}${Capitalize<ColorIntensity>}`

export function paletteIntensityToClass(
  palette: PaletteName,
  intensity: ColorIntensity
) {
  return !palette || !intensity
    ? undefined
    : (`color${capitalize(palette)}${capitalize(intensity)}` as PaletteClassKey)
}
