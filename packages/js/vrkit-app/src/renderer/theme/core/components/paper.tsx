import type { Theme, Components } from '@mui/material/styles';

import { appAlpha } from '../../styles';
import { important } from "vrkit-shared-ui"

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
    root: ({ theme }) => ({
      backgroundImage: theme.palette.background.paperImage,
      backgroundColor: theme.palette.background.paper
    }),
    
    outlined: ({ theme }) => ({
      borderColor: appAlpha(theme.palette.grey['500'], 0.16),
    }),
  },
};

// ----------------------------------------------------------------------

export const paper = { MuiPaper };
