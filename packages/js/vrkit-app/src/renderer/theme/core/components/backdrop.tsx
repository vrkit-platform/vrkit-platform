import type { Theme, Components } from '@mui/material/styles';

import { appAlpha } from '../../styles';

// ----------------------------------------------------------------------

const MuiBackdrop: Components<Theme>['MuiBackdrop'] = {
  /** **************************************
   * STYLE
   *************************************** */
  styleOverrides: {
    root: ({ theme }) => ({
      backgroundColor: appAlpha(theme.palette.grey['800'], 0.48),
    }),
    invisible: { background: 'transparent' },
  },
};

// ----------------------------------------------------------------------

export const backdrop = { MuiBackdrop };
