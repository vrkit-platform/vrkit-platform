import type {
  Direction, Theme as BaseTheme, ThemeOptions
} from "@mui/material/styles"
// import "./core/palette"
//import type { CssVarsTheme, CssVarsThemeOptions } from '@mui/material/styles';
import type { TypographyOptions } from "@mui/material/styles/createTypography"
import type { CSSProperties } from "@mui/material/styles/createMixins"
import type { AppButtonProps } from "../components/app-button"

// ----------------------------------------------------------------------

export type Theme = BaseTheme
// export type Theme = Omit<BaseTheme, "components"> & {
//   components: ThemeComponents
// } //Omit<BaseTheme, 'palette' | 'applyStyles'> //&
                              // CssVarsTheme;

export type ThemeUpdateOptions = Omit<ThemeOptions, "typography"> & {
  typography?:TypographyOptions;
};


// export type ThemeComponents = BaseTheme["components"] & {
//   AppButton: {
//     defaultProps: Partial<AppButtonProps>
//     styles: CSSProperties
//     variants: {
//       action: CSSProperties
//       normal: CSSProperties
//     }
//   }
// }

export type ThemeColorScheme = "light" | "dark";

export type ThemeDirection = "ltr" | "rtl";

export type ThemeLocaleComponents = { components: BaseTheme["components"] };


// import type { alpha, createTheme, darken, lighten } from
// "@mui/material/styles"

declare global {
  
  interface Dimensions {
    electronTrafficLightsWidth:number
    
    appBarHeight:number | string
    
    listActionFooterHeight:number | string
    
    layoutPadding:[number, number?, number?, number?]
    
    appIconSizes:[sm:number, md:number, lg:number, xl:number]
  }
  
  interface StyleUtility {
    rightShadow:string
    
  }
  
  interface ThemeColors {
    appBarSearchBorderColor:string
  }
  
  // type ThemeComponents = BaseTheme["components"] & {
  //
  // }
}

/**
 * Augment the create palette types
 */
declare module "@mui/material/styles/createPalette" {
  interface TypeAction {
    contrastText: string
  }
  interface TypeBackground {
    appBar:string
    
    appBarSearch:string
    
    appBarGradient:string
    
    root:string
    
    rootImage:string
    
    gradient:string
    
    gradientImage:string
    
    session:string
    
    sessionImage:string
    
    paperImage:string
    
    paperFooter:string
    
    drawerBgPaper:string
    
    drawerBgPaperGradient:string
    
    actionFooter:string
    
    actionFooterImage:string
    
    filledInput:string
    
    filledInputDisabled:string
    
    neutral:string;
    
    neutralChannel:string;
    
    pane00:string
    
    pane01:string
    
    pane02:string
  }
}
declare module "@mui/material/styles/createMixins" {
  interface Mixins {
    fadeTop:CSSProperties
    
    fadeBottom:CSSProperties
  }
  
  interface MixinOptions {
    fadeTop?:CSSProperties
    
    fadeBottom?:CSSProperties
  }
}
declare module "@mui/material/styles" {
  export interface Components<Theme = unknown> {
    AppButton?: {
      defaultProps?: Partial<AppButtonProps>
      styles?: CSSProperties
      variants?: {
        primary?: CSSProperties
        normal?: CSSProperties
      }
    }
  }
  interface Theme {
    dimen:Dimensions
    
    colorScheme: ThemeColorScheme
    colors:ThemeColors
    
    insetShadows: Theme["shadows"]
    
    styleUtility:StyleUtility,
    
    // components: ThemeComponents
    // components: ThemeComponents
  }
  
  // allow configuration using `createTheme`
  interface ThemeOptions {
    dimen?:Partial<Dimensions>
    insetShadows?: Theme["shadows"]
    colors?:Partial<ThemeColors>
    
    styleUtility?:StyleUtility
  }
}

export interface ThemeConfig {
  direction?:Direction
  
  responsiveFontSizes?:boolean
  
  roundedCorners?:boolean
  
  theme?:string
}

export type ThemeBuilderOptions = {
  static:ThemeOptions
  dynamic:(theme:BaseTheme) => ThemeOptions
}


export {
  ThemeOptions
}