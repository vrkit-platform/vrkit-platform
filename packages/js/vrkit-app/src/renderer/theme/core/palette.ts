import type { ColorSystemOptions } from '@mui/material/styles';

import COLORS from './colors.json';
import { appAlpha, createPaletteChannel } from '../styles';

// ----------------------------------------------------------------------

declare module '@mui/material/styles/createPalette' {
  interface CommonColors {
    whiteChannel: string;
    blackChannel: string;
  }
  interface TypeText {
    disabledChannel: string;
  }
  interface TypeBackground {
    neutral: string;
    neutralChannel: string;
  }
  interface SimplePaletteColorOptions {
    lighter: string;
    darker: string;
    lighterChannel: string;
    darkerChannel: string;
  }
  interface PaletteColor {
    lighter: string;
    darker: string;
    lighterChannel: string;
    darkerChannel: string;
  }
}

declare module '@mui/material/styles' {
  interface ThemeVars {
    transitions: Theme['transitions'];
  }
}

declare module '@mui/material' {
  interface Color {
    ['50']: string;
    ['100']: string;
    ['200']: string;
    ['300']: string;
    ['400']: string;
    ['500']: string;
    ['600']: string;
    ['700']: string;
    ['800']: string;
    ['900']: string;
  }
}

export type ColorType = 'primary' | 'secondary' | 'info' | 'success' | 'warning' | 'error';

// ----------------------------------------------------------------------

// Grey
export const grey = createPaletteChannel(COLORS.grey);

// Primary
export const primary = createPaletteChannel(COLORS.primary);

// Secondary
export const secondary = createPaletteChannel(COLORS.secondary);

// Info
export const info = createPaletteChannel(COLORS.info);

// Success
export const success = createPaletteChannel(COLORS.success);

// Warning
export const warning = createPaletteChannel(COLORS.warning);

// Error
export const error = createPaletteChannel(COLORS.error);

// Common
export const common = createPaletteChannel(COLORS.common);

// Text
export const text = {
  light: createPaletteChannel({ primary: grey[800], secondary: grey[600], disabled: grey[500] }),
  dark: createPaletteChannel({ primary: '#FFFFFF', secondary: grey[500], disabled: grey[600] }),
};

// Background
export const background = {
  light: createPaletteChannel({ paper: '#FFFFFF', default: '#FFFFFF', neutral: grey[200] }),
  dark: createPaletteChannel({ paper: grey[800], default: grey[900], neutral: '#28323D' }),
};

// Action
export const baseAction = {
  hover: appAlpha(grey['500'], 0.08),
  selected: appAlpha(grey['500'], 0.16),
  focus: appAlpha(grey['500'], 0.24),
  disabled: appAlpha(grey['500'], 0.8),
  disabledBackground: appAlpha(grey['500'], 0.24),
  hoverOpacity: 0.08,
  disabledOpacity: 0.48,
};

export const action = {
  light: { ...baseAction, active: grey[600] },
  dark: { ...baseAction, active: grey[500] },
};

/*
 * Base palette
 */
export const basePalette = {
  primary,
  secondary,
  info,
  success,
  warning,
  error,
  grey,
  common,
  divider: appAlpha(grey['500'], 0.2),
  action,
};

export const lightPalette = {
  ...basePalette,
  text: text.light,
  background: background.light,
  action: action.light,
};

export const darkPalette = {
  ...basePalette,
  text: text.dark,
  background: background.dark,
  action: action.dark,
};

// ----------------------------------------------------------------------

export const colorSchemes: Partial<Record<'dark' | 'light', ColorSystemOptions>> = {
  light: { palette: lightPalette },
  dark: { palette: darkPalette },
};
