import type { Theme, Components } from '@mui/material/styles';

import { paper, appAlpha, stylesMode } from '../../styles';

// ----------------------------------------------------------------------

const MuiDrawer: Components<Theme>['MuiDrawer'] = {
  /** **************************************
   * STYLE
   *************************************** */
  styleOverrides: {
    paperAnchorRight: ({ ownerState, theme }) => ({
      ...(ownerState.variant === 'temporary' && {
        ...paper({ theme }),
        boxShadow: `-40px 40px 80px -8px ${appAlpha(theme.palette.grey['500'], 0.24)}`,
        [stylesMode.dark]: {
          boxShadow: `-40px 40px 80px -8px ${appAlpha(theme.palette.common.blackChannel, 0.24)}`,
        },
      }),
    }),
    paperAnchorLeft: ({ ownerState, theme }) => ({
      ...(ownerState.variant === 'temporary' && {
        ...paper({ theme }),
        boxShadow: `40px 40px 80px -8px ${appAlpha(theme.palette.grey['500'], 0.24)}`,
        [stylesMode.dark]: {
          boxShadow: `40px 40px 80px -8px  ${appAlpha(theme.palette.common.blackChannel, 0.24)}`,
        },
      }),
    }),
  },
};

// ----------------------------------------------------------------------

export const drawer = { MuiDrawer };
