import { Theme, Components, darken } from "@mui/material/styles"

import { paper, appAlpha, stylesMode } from '../../styles';
import { alpha } from "vrkit-shared-ui"

// ----------------------------------------------------------------------

const MuiDrawer: Components<Theme>['MuiDrawer'] = {
  /** **************************************
   * STYLE
   *************************************** */
  styleOverrides: {
    paper: ({theme}) => ({
      backgroundImage: theme.palette.background.drawerBgPaperGradient,
      backgroundColor: theme.palette.background.drawerBgPaper,
      border: "none",
      boxShadow: `5px 0px 10px 2px ${appAlpha(theme.palette.common.blackChannel, 0.14)}`,
    }),
    paperAnchorRight: ({ ownerState, theme }) => ({
      ...(ownerState.variant === 'temporary' && {
        ...paper({ theme }),
        boxShadow: `-40px 40px 80px -8px ${appAlpha(theme.palette.common.blackChannel, 0.24)}`,
      }),
    }),
    paperAnchorLeft: ({ ownerState, theme }) => ({
      ...(ownerState.variant === 'temporary' && {
        ...paper({ theme }),
//        boxShadow: `40px 40px 80px -8px ${appAlpha(theme.palette.grey['500'], 0.24)}`,
        boxShadow: `40px 40px 80px -8px  ${appAlpha(theme.palette.common.blackChannel, 0.24)}`,

      }),
    }),
  },
};

// ----------------------------------------------------------------------

export const drawer = { MuiDrawer };
