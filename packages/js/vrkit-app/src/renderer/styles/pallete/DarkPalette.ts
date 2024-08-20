import { createPalette } from "./PaletteHelpers"
// noinspection ES6PreferShortImport
import { Palette } from "./PaletteAndColors"
import { lighten } from "@mui/system"
import { alpha } from "../ThemedStyles"

const tinycolor = require("tinycolor2"),
  textBase = "#DfDcD6"

// const slatePalette = createPalette("#151921", "A200", "500", "700")
const slatePalette = createPalette(
  "#222b36",
  "A200",
  "500",
  "700"
)

const text = {
    primary: "#fff",
    secondary: "rgba(255, 255, 255, 0.7)",
    disabled: "rgba(255, 255, 255, 0.5)",
    hint: "rgba(255, 255, 255, 0.5)",
    icon: "rgba(255, 255, 255, 0.5)"
  },
  secondary = createPalette("#2862F4", "700", "900", "800") // app icons and text

export const darkPalette = {
  type: "dark",
  name: "Dark",
  description: `Dark (Recommended)`,
  ok: createPalette("#7015A8", "A200", "A400", "A700"),
  secondary,
  primary: createPalette("#7015A8", "A200", "A400", "A700"),
  background: {
    default: slatePalette.main,
    paper: slatePalette["300"],
    level1: slatePalette["500"],
    level2: slatePalette["600"]
  },

  //focus: createPalette("rgba(26,163,255,0.50)", "A200", "500", "A700"),
  text, //createPalette(textBase, "A100", "A400", "A700"),
  //textNight: createPalette(textBase, "A200", "A400", "A700"),

  verbose: createPalette(
    tinycolor(textBase).setAlpha(0.5).toString("rgb"),
    "A200",
    "500",
    "A700"
  ),
  error: createPalette("#ff3633", "A200", "A400", "A700"),
  warn: createPalette("#d2a92a", "A200", "A400", "A700"),

  success: {
    ...createPalette("#339f2d", "A200", "A400", "A700"),
    contrastText: "white"
  },
  // action: {
  //   active: "rgba(40, 98, 244, 0.24)",
  //   activatedOpacity: 0.24,
  //   hover: "rgba(40, 98, 244, 0.30)",
  //   hoverOpacity: 0.30,
  //   selected: "rgba(40, 98, 244, 0.76)",
  //   selectedOpacity: 0.76,
  //   disabled: "rgba(255, 255, 255, 0.3)",
  //   disabledBackground: "rgba(255, 255, 255, 0.12)",
  //   disabledOpacity: 0.78,
  //   focus: "rgba(40, 98, 244, 0.82)",
  //   // focus: "rgba(255, 255, 255, 0.12)",
  //   focusOpacity: 0.82
  // },
  // action: createPalette("#3c3eff", "300", "A400", "A700"),
  action: {
    active: "#fff",
    //hover: alpha(secondary.main,0.6),
    hover: "rgba(255, 255, 255, 0.08)",
    hoverOpacity: 0.08,
    selected: "rgba(255, 255, 255, 0.16)",
    selectedOpacity: 0.16,
    disabled: "rgba(255, 255, 255, 0.3)",
    disabledBackground: "rgba(255, 255, 255, 0.12)",
    disabledOpacity: 0.38,
    focus: "rgba(255, 255, 255, 0.12)",
    //focus: alpha(secondary.main,0.4),
    focusOpacity: 0.12,
    activatedOpacity: 0.24
  },
  notifications: createPalette(
    "#ff3633",
    "A200",
    "A400",
    "A700"
  ),
  border: createPalette("#404040", "700", "900", "800"),

  divider: lighten(slatePalette["100"], 0.2),
  code: {
    background: "#282c34",
    class: "#e6c07b",
    comment: "#5c6370",
    keyword: "#c678dd",
    literal: "#56b6c2",
    section: "#e06c75",
    string: "#98c379",
    symbol: "#61aeee",
    text: "#abb2bf",
    variable: "#d19a66"
  }
} as Palette
