import type { Theme, ThemeOptions } from "@mui/material/styles"
import type { SettingsState } from 'vrkit-app-renderer/components/settings';

import { createTheme as muiCreateTheme} from '@mui/material/styles';

import { createPaletteChannel, setFont } from "./styles/utils"
import { overridesTheme } from './overrides-theme';
import { shadows, typography, components, colorSchemes, customShadows } from './core';
import { updateCoreWithSettings, updateComponentsWithSettings } from './with-settings/update-theme';

import type { ThemeLocaleComponents } from './types';
import { assign } from "vrkit-app-common/utils"
import { linearGradient, rem } from "../styles"
import { lighten } from "@mui/system"
import { darken } from "@mui/material"
import { darkPrimaryAndSecondaryPalettes } from "./paletteAndColorHelpers"

// ----------------------------------------------------------------------

const bgPaper = "#1F2025"

const appBarBackgroundColor = "rgba(52, 50, 54, 0.999)"//lighten(,0.25)
const appBarSearchBackgroundColor = darken(appBarBackgroundColor,0.15)
const appBarSearchBorderColor = darken(appBarBackgroundColor,0.3)


const darkDefault = lighten("#1F2025", 0.025)

const themeOptions: ThemeOptions = {
  palette: {
    background: {
      default: darkDefault,
      paper: bgPaper,
      paperFooter: "#1A151E",
      actionFooter: lighten(bgPaper, 0.1),
      filledInput: "rgba(255, 255, 255, 0.13)",
      filledInputDisabled: "rgba(255, 255, 255, 0.12)",
      appBar: appBarBackgroundColor, // "#2E3133",
      appBarSearch: appBarSearchBackgroundColor,
      appBarGradient: linearGradient(
          "to bottom",
          `rgba(52, 50, 54, 0.999) 0%`,
          `${darken("rgba(52, 50, 54, 0.999)", 0.1)} 90%`,
          `${darken("rgba(52, 50, 54, 0.999)", 0.25)} 100%`
      ),
      
      // ...paneBackgrounds("#1F2025", 3, 0.025)
    },
    divider: "rgba(145, 158, 171, 0.24)",
    error: createPaletteChannel({
      contrastText: "#ffffff",
      main: "#f44336",
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
  localeComponents: ThemeLocaleComponents,
  settings: SettingsState
): Theme {
  const initialTheme = {
    colorSchemes,
    shadows: shadows(settings.colorScheme),
    customShadows: customShadows(settings.colorScheme),
    direction: settings.direction,
    shape: { borderRadius: 8 },
    components,
    typography: {
      ...typography,
      fontFamily: setFont(settings.fontFamily),
    },
    cssVarPrefix: '',
    shouldSkipGeneratingVar,
  };

  /**
   * 1.Update values from settings before creating theme.
   */
  const updateTheme = updateCoreWithSettings(initialTheme, settings);

  /**
   * 2.Create theme + add locale + update component with settings.
   */
  const theme = muiCreateTheme(themeOptions)
  //     extendTheme(
  //   updateTheme,
  //   localeComponents,
  //   updateComponentsWithSettings(settings),
  //   overridesTheme
  // );

  return assign(theme, {
    dimen: {
      electronTrafficLightsWidth: 70,
      appBarHeight: "4rem",
      listActionFooterHeight: rem(2),
      layoutPadding: [4, 2], // spacing unit
      projectIconSizes: [
        16,32,64,128
      ]
    },
    
    
  });
}

// ----------------------------------------------------------------------

function shouldSkipGeneratingVar(keys: string[], value: string | number): boolean {
  const skipGlobalKeys = [
    'mixins',
    'overlays',
    'direction',
    'breakpoints',
    'cssVarPrefix',
    'unstable_sxConfig',
    'typography',
    // 'transitions',
  ];

  const skipPaletteKeys: {
    [key: string]: string[];
  } = {
    global: ['tonalOffset', 'dividerChannel', 'contrastThreshold'],
    grey: ['A100', 'A200', 'A400', 'A700'],
    text: ['icon'],
  };

  const isPaletteKey = keys[0] === 'palette';

  if (isPaletteKey) {
    const paletteType = keys[1];
    const skipKeys = skipPaletteKeys[paletteType] || skipPaletteKeys.global;

    return keys.some((key) => skipKeys?.includes(key));
  }

  return keys.some((key) => skipGlobalKeys?.includes(key));
}

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
