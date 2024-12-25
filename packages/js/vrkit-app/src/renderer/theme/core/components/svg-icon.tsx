import type { Theme, Components } from '@mui/material/styles';
import { rem } from "@vrkit-platform/shared-ui"

// ----------------------------------------------------------------------

const MuiSvgIcon: Components<Theme>['MuiSvgIcon'] = {
  /** **************************************
   * STYLE
   *************************************** */
  styleOverrides: {
    fontSizeSmall: { width: rem(0.8), height: rem(0.8), fontSize: 'inherit' },
    fontSizeMedium: { width: rem(1), height: rem(1), fontSize: 'inherit' },
    fontSizeLarge: { width: rem(1.4), height: rem(1.4), fontSize: 'inherit' }
  },
};

// ----------------------------------------------------------------------

export const svgIcon = { MuiSvgIcon };
