import { createPalette } from "./PaletteHelpers"
import { Palette } from "./PaletteAndColors"

const tinycolor = require("tinycolor2"),
  textBase = "rgba(0,0,0,0.8)"

const slatePalette = createPalette(
  "#cfcfcf",
  "A200",
  "500",
  "700"
)

export const lightPalette = {
  type: "light",
  name: "Light",
  description: "Light color theme",
  secondary: createPalette("#7015A8", "300", "400", "600"),
  //secondary: createPalette("#3f51b5", "100", "400", "600"), // app icons and text
  //focus: createPalette("rgba(26,163,255,0.50)", "A200", "500", "A700"),
  // primary: createPalette("#f3f3f3", "100", "400", "600"), // app icons and text
  primary: createPalette("#3f51b5", "100", "400", "600"), // app icons and text
  ok: createPalette("#7015A8", "A200", "A400", "A700"),
  background: {
    default: "#eeeeee",
    paper: slatePalette["100"],
    level1: slatePalette["400"],
    level2: slatePalette["500"]
  }, //createPalette("#fefefe", "100", "300", "500"),
  text: {
    primary: "#212121",
    secondary: "rgba(35, 35, 35, 0.7)",
    disabled: "rgba(35, 35, 35, 0.5)",
    hint: "rgba(35, 35, 35, 0.6)",
    icon: "rgba(35, 35, 35, 0.7)"
  },
  divider: slatePalette["500"],
  //textNight: createPalette("#FFFFFF", "A200", "A400", "A700"),
  error: createPalette("#ff3633", "A200", "A400", "A700"),

  verbose: createPalette(
    tinycolor(textBase).setAlpha(0.5).toString("hex8"),
    "A200",
    "A400",
    "A700"
  ),
  warn: createPalette("#d2a92a", "A200", "A400", "A700"),
  success: createPalette("#3edb37", "A200", "A400", "A700"),
  // action: {
  //   active: "#fff",
  //   hover: "rgba(255, 255, 255, 0.08)",
  //   hoverOpacity: 0.08,
  //   selected: "rgba(255, 255, 255, 0.16)",
  //   selectedOpacity: 0.16,
  //   disabled: "rgba(255, 255, 255, 0.3)",
  //   disabledBackground: "rgba(255, 255, 255, 0.12)",
  //   disabledOpacity: 0.38,
  //   focus: "rgba(255, 255, 255, 0.12)",
  //   focusOpacity: 0.12,
  //   activatedOpacity: 0.24
  // },
  action: {
    active: "rgba(40, 98, 244, 0.24)",
    activatedOpacity: 0.24,
    hover: "rgba(40, 98, 244, 0.9)",
    hoverOpacity: 0.9,
    selected: "rgba(40, 98, 244, 0.76)",
    selectedOpacity: 0.76,
    disabled: "rgba(255, 255, 255, 0.3)",
    disabledBackground: "rgba(255, 255, 255, 0.12)",
    disabledOpacity: 0.78,
    focus: "rgba(40, 98, 244, 0.82)",
    // focus: "rgba(255, 255, 255, 0.12)",
    focusOpacity: 0.82
  },
  notifications: createPalette(
    "#ff3633",
    "A200",
    "A400",
    "A700"
  ),
  border: createPalette("#c0c0c0", "300", "400", "500"),

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
