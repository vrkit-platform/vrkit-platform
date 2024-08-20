import { isDefined } from "@3fv/guard"
import { getContrastRatio } from "@mui/system"
import {
  ColorVariant,
  PaletteColorConfig,
  PaletteDefault
} from "./PaletteAndColors"
import memoize from "lodash/memoize"
// import {dark, light} from "@mui/material/styles/createPalette"

const tc = require("tinycolor2")

export function createPalette(
  hex: string,
  light: ColorVariant | null = null,
  main: ColorVariant | null = null,
  dark: ColorVariant | null = null
): PaletteColorConfig {
  const colors = [
    {
      hex: tc(hex).lighten(46).toHexString(),
      name: "50"
    },
    {
      hex: tc(hex).lighten(34).toHexString(),
      name: "100"
    },
    {
      hex: tc(hex).lighten(26).toHexString(),
      name: "200"
    },
    {
      hex: tc(hex).lighten(12).toHexString(),
      name: "300"
    },
    {
      hex: tc(hex).lighten(6).toHexString(),
      name: "400"
    },
    {
      hex: hex,
      name: "500"
    },
    {
      hex: tc(hex).darken(6).toHexString(),
      name: "600"
    },
    {
      hex: tc(hex).darken(12).toHexString(),
      name: "700"
    },
    {
      hex: tc(hex).darken(18).toHexString(),
      name: "800"
    },
    {
      hex: tc(hex).darken(24).toHexString(),
      name: "900"
    },
    {
      hex: tc(hex).lighten(52).toHexString(),
      name: "A100"
    },
    {
      hex: tc(hex).lighten(37).toHexString(),
      name: "A200"
    },
    {
      hex: tc(hex).lighten(6).toHexString(),
      name: "A400"
    },
    {
      hex: tc(hex).darken(12).toHexString(),
      name: "A700"
    }
  ]

  const palette = colors.reduce((palette, nextColor) => {
    palette[nextColor.name] = nextColor.hex
    return palette
  }, {}) as PaletteColorConfig

  Array<[PaletteDefault, ColorVariant]>(
    ["main", main],
    ["light", light],
    ["dark", dark]
  )
    .filter(pair => isDefined(pair[1]))
    .forEach(([name, attr]) => {
      palette[name] = palette[attr]
    })

  palette.contrastText = getContrastText(hex)
  return palette
}

const contrastThreshold = 4

export const getContrastText = memoize(
  (
    background: string,
    fgColor: string = "#FFFFFF",
    useContrastThreshold: number = contrastThreshold
  ): string => {
    // Use the same logic as
    // Bootstrap: https://github.com/twbs/bootstrap/blob/1d6e3710dd447de1a200f29e8fa521f8a0908f70/scss/_functions.scss#L59
    // and material-components-web https://github.com/material-components/material-components-web/blob/ac46b8863c4dab9fc22c4c662dc6bd1b65dd652f/packages/mdc-theme/_functions.scss#L54
    //const contrastText =
    //debugger
    return getContrastRatio(background, fgColor) >=
      useContrastThreshold
      ? fgColor
      : "#121212"

    // if (process.env.NODE_ENV !== 'production') {
    //     const contrast = getContrastRatio(background, contrastText);
    //     warning(
    //       contrast >= 3,
    //       [
    //           `Material-UI: the contrast ratio of ${contrast}:1 for ${contrastText} on ${background}`,
    //           'falls below the WACG recommended absolute minimum contrast ratio of 3:1.',
    //           'https://www.w3.org/TR/2008/REC-WCAG20-20081211/#visual-audio-contrast-contrast',
    //       ].join('\n'),
    //     );
    // }

    //return contrastText;
  }
)
