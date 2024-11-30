
// noinspection ES6UnusedImports
import type {} from "@mui/lab/themeAugmentation"
// noinspection ES6UnusedImports
import type {} from "@mui/x-tree-view/themeAugmentation"
// noinspection ES6UnusedImports
import type {} from "@mui/x-data-grid/themeAugmentation"
// noinspection ES6UnusedImports
// import type {} from "@mui/material/themeCssVarsAugmentation"

import type { Direction, Theme, ThemeOptions } from "@mui/material/styles"
import { createTheme as muiCreateTheme } from "@mui/material/styles"

// import { createPaletteChannel, setFont } from "vrkit-shared-ui"
import {
  colorSchemes, components, customShadows, shadows, typography
} from "./core"

import type { ThemeLocaleComponents } from "./ThemeTypes"
import { assign } from "vrkit-shared"
import { alpha, linearGradient, rem } from "vrkit-shared-ui"
import { lighten, darken } from "@mui/material"
import { darkPrimaryAndSecondaryPalettes } from "./paletteAndColorHelpers"
import { createPaletteChannel, pxToRem, setFont } from "./styles"

// ----------------------------------------------------------------------


const rootBackgroundColor = "rgba(52,50,54,1)" //lighten(,0.25)
const rootBackgroundGradient = linearGradient(
    "to bottom",
    `${rootBackgroundColor} 0%`,
    `${lighten(rootBackgroundColor, 0.025)} 95%`,
    `${lighten(rootBackgroundColor, 0.035)} 100%`
)


const slateBackgroundColor = "rgba(42, 40, 44, 0.999)" //lighten(,0.25)
const slateBackgroundGradient = linearGradient(
  "to bottom",
  `${slateBackgroundColor} 0%`,
  `${darken(slateBackgroundColor, 0.1)} 90%`,
  `${darken(slateBackgroundColor, 0.25)} 100%`
)

// const bgPaper = "#1F2025"
const bgPaper = lighten(slateBackgroundColor,0.025)
const bgPaperGradient = linearGradient(
    "to bottom",
    `${darken(bgPaper,0.03)} 0%`,
    `${darken(bgPaper, 0.05)} 90%`,
    `${darken(bgPaper, 0.15)} 100%`
)

const drawerBgPaper = darken(slateBackgroundColor,0.025)
const drawerBgPaperGradient = linearGradient(
    "to bottom",
    `${drawerBgPaper} 0%`,
    `${darken(drawerBgPaper, 0.05)} 90%`,
    `${darken(drawerBgPaper, 0.15)} 100%`
)

const actionFooter = alpha(darken(bgPaper, 0.25), 0.9)
const actionFooterImage = linearGradient(
    "to top",
    `${actionFooter} 0%`,
    `${darken(actionFooter, 0.05)} 90%`,
    `${darken(actionFooter, 0.15)} 100%`
)

const sessionBackgroundColor = "rgba(32, 30, 34, 0.999)" //lighten(,0.25)
const sessionBackgroundGradient = linearGradient(
    "to bottom",
    `${darken(slateBackgroundColor, 0.25)} 0%`,
    `${sessionBackgroundColor} 3%`,
    `${darken(sessionBackgroundColor, 0.1)} 90%`,
    `${darken(sessionBackgroundColor, 0.25)} 90%`,
        `${slateBackgroundColor} 100%`,
)



const appBarSearchBackgroundColor = darken(slateBackgroundColor, 0.15)
const appBarSearchBorderColor = darken(slateBackgroundColor, 0.3)

const darkDefault = lighten("#1F2025", 0.025)

const themeOptions: ThemeOptions = {
  
  palette: {
    background: {
      default: darkDefault,
      root: rootBackgroundColor,
      rootImage: rootBackgroundGradient,
      gradient: slateBackgroundColor,
      gradientImage: slateBackgroundGradient,
      session: sessionBackgroundColor,
      sessionImage: sessionBackgroundGradient,
      paper: bgPaper,
      paperImage: bgPaperGradient,
      paperFooter: "#1A151E",
      drawerBgPaper,
      drawerBgPaperGradient,
      actionFooter,
      actionFooterImage,
      filledInput: "rgba(255, 255, 255, 0.13)",
      filledInputDisabled: "rgba(255, 255, 255, 0.12)",
      appBar: slateBackgroundColor, // "#2E3133",
      appBarSearch: appBarSearchBackgroundColor,
      appBarGradient: slateBackgroundGradient

      // ...paneBackgrounds("#1F2025", 3, 0.025)
    },
    divider: "rgba(145, 158, 171, 0.24)",
    error: createPaletteChannel({
      contrastText: "#ffffff",
      main: "#f44336"
    }),
    mode: "dark",
    ...darkPrimaryAndSecondaryPalettes,
    success: createPaletteChannel({
      contrastText: "#ffffff",
      main: "#2B993B"
    }),
    info: createPaletteChannel({
      main: "#0a8af3",
      contrastText: "#ffffff"
    }),
    action: {
      active: "#0a8af3"
    },
    text: {
      primary: "#ffffff",
      secondary: "#919eab"
    },
    warning: createPaletteChannel({
      contrastText: "#ffffff",
      main: "#ff9800"
    })
  }
}

export function createTheme(
  localeComponents: ThemeLocaleComponents
): Theme {
  const colorScheme = "dark"
  const initialTheme = {
    colorSchemes,
    shadows: shadows(colorScheme),
    customShadows: customShadows(colorScheme),
    direction: "ltr" as Direction,
    shape: { borderRadius: 8 },
    components,
    typography: {
      ...typography,
      fontFamily: setFont("SanFranciscoDisplay")
      
      // fontFamily: setFont(settings.fontFamily)
    },
    // cssVarPrefix: "",
    // shouldSkipGeneratingVar
  }

  /**
   * 2.Create theme + add locale + update component with settings.
   */
  const theme = muiCreateTheme(themeOptions)

  return assign(theme, {
    //colorSchemes,
    shadows: shadows(colorScheme),
    customShadows: customShadows(colorScheme),
    direction: "ltr" as Direction,
    shape: { borderRadius: 8 },
    components,
    typography: {
      ...theme.typography,
      ...typography,
      // pxToRem,
      fontFamily: setFont("SanFranciscoDisplay")
      
      // fontFamily: setFont(settings.fontFamily)
    },
    dimen: {
      electronTrafficLightsWidth: 70,
      appBarHeight: "3rem",
      listActionFooterHeight: rem(2),
      layoutPadding: [4, 2], // spacing unit
      appIconSizes: [16, 32, 64, 128]
    },
    // typography: {
    //   fontFamily: setFont("SanFranciscoDisplay")
    // } as any
  })
}

// ----------------------------------------------------------------------

/**
 * createTheme without @settings and @locale components.
 *
 ```jsx
 export function createTheme(): Theme {
 const initialTheme = {
 colorSchemes,
 shadows: shadows('light'),
 customShadows: customShadows('light'),
 shape: { borderRadius: 8 },
 components,
 typography,
 cssVarPrefix: '',
 shouldSkipGeneratingVar,
 };
 
 const theme = extendTheme(initialTheme, overridesTheme);
 
 return theme;
 }
 ```
 */
