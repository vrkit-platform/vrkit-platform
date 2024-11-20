import type { Theme, Components } from '@mui/material/styles';

import { appAlpha } from '../../styles';

// ----------------------------------------------------------------------

const MuiPaper: Components<Theme>['MuiPaper'] = {
  /** **************************************
   * DEFAULT PROPS
   *************************************** */
  defaultProps: { elevation: 0 },

  /** **************************************
   * STYLE
   *************************************** */
  styleOverrides: {
    root: { backgroundImage: 'none' },
    outlined: ({ theme }) => ({
      borderColor: appAlpha(theme.palette.grey['500'], 0.16),
    }),
  },
};

// ----------------------------------------------------------------------

export const paper = { MuiPaper };
