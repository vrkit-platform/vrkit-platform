import type { TypographyOptions } from "@mui/material/styles/createTypography"

import { setFont } from "../styles"
import React from "react"
import { rem, remToPx } from "@vrkit-platform/shared-ui"

// ----------------------------------------------------------------------

declare module "@mui/material/styles" {
  interface TypographyOptions {
  
  }
  interface TypographyVariants {
    titleBar: React.CSSProperties
    
    fontSecondaryFamily: React.CSSProperties["fontFamily"]

    fontWeightSemiBold: React.CSSProperties["fontWeight"]
  }

  interface TypographyVariantsOptions {
    titleBar?: React.CSSProperties
    fontSecondaryFamily?: React.CSSProperties["fontFamily"]

    fontWeightSemiBold?: React.CSSProperties["fontWeight"]
  }
  
  interface ThemeVars {
    typography: Theme["typography"]
  }
}

declare module '@mui/material/Typography' {
  interface TypographyPropsVariantOverrides {
    titleBar?: true;
  }
}


// ----------------------------------------------------------------------

// export const defaultFont = "SanFranciscoDisplay" // 'Public Sans';
//export const defaultFont = 'Public Sans';
export enum Fonts {
  Inter = "Inter",
  PublicSans = "Public Sans",
  SanFranciscoDisplay = "SanFranciscoDisplay",
  AvenirNext = "AvenirNext",
  Roboto = "Roboto",
  RobotoSlab = "RobotoSlab",
  RobotoMono = "RobotoMono",
  Segoe = "Segoe",
  SegoeUI = "Segoe UI",
  Metro = "Metro",
  RaceSport = "Race Sport"
}

export const defaultFont = Fonts.SegoeUI

export const primaryFont = setFont(defaultFont)

export const secondaryFont = setFont(Fonts.Inter)

// ----------------------------------------------------------------------

export const typography: TypographyOptions = {
  fontFamily: primaryFont,
  fontSecondaryFamily: secondaryFont,
  fontWeightLight: "300",
  fontWeightRegular: "400",
  fontWeightMedium: "500",
  fontWeightSemiBold: "600",
  fontWeightBold: "700",
  titleBar: {
    fontFamily: setFont(Fonts.RaceSport)
  },
  h1: {
    fontWeight: 800,
    lineHeight: 2,
    fontSize: remToPx(1.4),
    fontFamily: secondaryFont
    // ...responsiveFontSizes({
    //   sm: 52,
    //   md: 58,
    //   lg: 64
    // })
  },
  h2: {
    fontWeight: 800,
    lineHeight: 1.6,
    fontSize: remToPx(1.3),
    fontFamily: secondaryFont
    // ...responsiveFontSizes({
    //   sm: 40,
    //   md: 44,
    //   lg: 48
    // })
  },
  h3: {
    fontWeight: 700,
    lineHeight: 1.4,
    fontSize: remToPx(1.2),
    fontFamily: secondaryFont
    // ...responsiveFontSizes({
    //   sm: 26,
    //   md: 30,
    //   lg: 32
    // })
  },
  h4: {
    fontWeight: 600,
    lineHeight: 1.4,
    fontSize: remToPx(1.15)
    // ...responsiveFontSizes({ sm: 20, md: 24, lg: 24 })
  },
  h5: {
    fontWeight: 500,
    lineHeight: 1.4,
    fontSize: remToPx(1.15)
    // ...responsiveFontSizes({ sm: 19, md: 20, lg: 20 })
  },
  h6: {
    fontWeight: 400,
    lineHeight: 1.4,
    fontSize: remToPx(1.15)
    // ...responsiveFontSizes({ sm: 18, md: 18, lg: 18 })
  },
  subtitle1: {
    fontWeight: 400,
    lineHeight: 1.4,
    letterSpacing: 1,
    fontSize: remToPx(0.9),
    opacity: 0.5
  },
  subtitle2: {
    fontWeight: 400,
    lineHeight: 1.4,
    fontSize: remToPx(0.8),
    opacity: 0.35
  },
  body1: {
    fontWeight: 400,
    lineHeight: 1.2,
    fontSize: remToPx(0.9)
  },
  body2: {
    lineHeight: 1.2,
    fontSize: remToPx(0.8)
  },
  caption: {
    lineHeight: 1,
    fontSize: remToPx(1)
  },
  overline: {
    fontWeight: 700,
    lineHeight: 1,
    fontSize: remToPx(1),
    textTransform: "uppercase"
  },
  button: {
    fontWeight: 400,
    verticalAlign: "middle",
    lineHeight: 1,
    letterSpacing: 0.7,
    fontSize: remToPx(1),
    fontFamily: setFont(Fonts.SegoeUI),
    textTransform: "unset"
    // textTransform: "uppercase"
    //textTransform: "uppercase"
  }
}
