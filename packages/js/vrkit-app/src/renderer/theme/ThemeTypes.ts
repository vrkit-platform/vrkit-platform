import type { Theme as BaseTheme, Direction, ThemeOptions } from "@mui/material/styles"

import type { CssVarsTheme, CssVarsThemeOptions } from '@mui/material/styles';
import type { TypographyOptions } from '@mui/material/styles/createTypography';

// ----------------------------------------------------------------------

export type Theme = Omit<BaseTheme, 'palette' | 'applyStyles'> & CssVarsTheme;

export type ThemeUpdateOptions = Omit<CssVarsThemeOptions, 'typography'> & {
  typography?: TypographyOptions;
};

export type ThemeComponents = CssVarsThemeOptions['components'];

export type ThemeColorScheme = 'light' | 'dark';

export type ThemeDirection = 'ltr' | 'rtl';

export type ThemeLocaleComponents = { components: ThemeComponents };


// import type { alpha, createTheme, darken, lighten } from "@mui/material/styles"

import type { CSSProperties } from "@mui/material/styles/createMixins"

declare global {
  interface Dimensions {
    electronTrafficLightsWidth: number
    appBarHeight: number | string
    listActionFooterHeight: number | string
    layoutPadding: [number, number?, number?, number?]
    projectIconSizes: [sm: number, md: number, lg: number, xl: number]
  }
  
  interface StyleUtility {
    rightShadow: string
    
  }
  
  interface ThemeColors {
    appBarSearchBorderColor: string
  }
}

/**
 * Augment the create palette types
 */
declare module "@mui/material/styles/createPalette" {
  interface TypeBackground {
    appBar: string
    appBarSearch: string
    appBarGradient: string
    gradient: string
    gradientImage: string
    session: string
    sessionImage: string
    paperFooter: string
    actionFooter: string
    filledInput: string
    filledInputDisabled: string
    pane00: string
    pane01: string
    pane02: string
  }
}
declare module "@mui/material/styles/createMixins" {
  interface Mixins {
    fadeTop: CSSProperties
    fadeBottom: CSSProperties
  }
  
  interface MixinOptions {
    fadeTop?: CSSProperties
    fadeBottom?: CSSProperties
  }
}
declare module "@mui/material/styles" {
  interface Theme {
    dimen: Dimensions
    colors: ThemeColors
    styleUtility: StyleUtility
  }
  // allow configuration using `createTheme`
  interface ThemeOptions {
    dimen?: Partial<Dimensions>
    colors?: Partial<ThemeColors>
    styleUtility?: StyleUtility
  }
}

export interface ThemeConfig {
  direction?: Direction
  responsiveFontSizes?: boolean
  roundedCorners?: boolean
  theme?: string
}

export type ThemeBuilderOptions = {
  static: ThemeOptions
  dynamic: (theme: Theme) => ThemeOptions
}


export {
  ThemeOptions
}