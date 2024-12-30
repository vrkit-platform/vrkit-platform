import type { Theme, Components } from '@mui/material/styles';

import { menuItem } from '../../styles';

// ----------------------------------------------------------------------

const MuiMenuItem: Components<Theme>['MuiMenuItem'] = {
  /** **************************************
   * STYLE
   *************************************** */
  styleOverrides: { root: ({ theme }) => ({ ...menuItem(theme) }) },
};

const MuiMenu: Components<Theme>['MuiMenu'] = {
  /** **************************************
   * STYLE
   *************************************** */
  defaultProps: {
  
  },
  styleOverrides: { root: ({ theme }) => ({  }) },
};

// ----------------------------------------------------------------------

export const menu = { MuiMenuItem };
