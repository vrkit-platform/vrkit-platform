import type { Theme, Components } from '@mui/material/styles';
import { padding } from "@vrkit-platform/shared-ui"
import {listClasses as muiListClasses} from "@mui/material/List"
import {menuItemClasses as muiMenuItemClasses} from "@mui/material/MenuItem"
// ----------------------------------------------------------------------


const MuiList: Components<Theme>['MuiList'] = {
  /** **************************************
   * STYLE
   *************************************** */
  styleOverrides: {
    
    root: ({ theme }) => ({
      [`&.${muiListClasses.padding}`]: {
        ...padding(0)
      },
      "&[role=menu]": {
        ...padding(0),
        [`& .${muiMenuItemClasses.root}`]: {
          "&:first-of-type": {
            borderTopRightRadius: theme.shape.borderRadius,
            borderTopLeftRadius: theme.shape.borderRadius
          },
          
          "&:not(:last-of-type)": {
            marginBottom: 0,
            borderBottomRightRadius: 0,
            borderBottomLeftRadius: 0
          },
          
          "&:last-of-type": {
            borderBottomRightRadius: theme.shape.borderRadius,
            borderBottomLeftRadius: theme.shape.borderRadius
          }
        }
      }
    }),
  },
};

const MuiListItemIcon: Components<Theme>['MuiListItemIcon'] = {
  /** **************************************
   * STYLE
   *************************************** */
  styleOverrides: {
    root: ({ theme }) => ({ color: 'inherit', minWidth: 'auto', marginRight: theme.spacing(2) }),
  },
};

// ----------------------------------------------------------------------

const MuiListItemAvatar: Components<Theme>['MuiListItemAvatar'] = {
  /** **************************************
   * STYLE
   *************************************** */
  styleOverrides: { root: ({ theme }) => ({ minWidth: 'auto', marginRight: theme.spacing(2) }) },
};

// ----------------------------------------------------------------------

const MuiListItemText: Components<Theme>['MuiListItemText'] = {
  /** **************************************
   * DEFAULT PROPS
   *************************************** */
  defaultProps: { primaryTypographyProps: { typography: 'subtitle2' } },

  /** **************************************
   * STYLE
   *************************************** */
  styleOverrides: { root: { margin: 0 }, multiline: { margin: 0 } },
};

// ----------------------------------------------------------------------

export const list = {
  MuiListItemIcon,
  MuiListItemAvatar,
  MuiListItemText,
  MuiList,
};
