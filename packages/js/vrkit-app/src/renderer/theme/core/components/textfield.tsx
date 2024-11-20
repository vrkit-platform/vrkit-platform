import type { Theme, Components } from '@mui/material/styles';

import { inputBaseClasses } from '@mui/material/InputBase';
import { filledInputClasses } from '@mui/material/FilledInput';
import { outlinedInputClasses } from '@mui/material/OutlinedInput';

import { appAlpha } from '../../styles';

// ----------------------------------------------------------------------

const MuiInputBase: Components<Theme>['MuiInputBase'] = {
  /** **************************************
   * STYLE
   *************************************** */
  styleOverrides: {
    root: ({ theme }) => ({
      [`&.${inputBaseClasses.disabled}`]: {
        '& svg': { color: theme.palette.text.disabled },
      },
    }),
    input: ({ theme }) => ({
      fontSize: theme.typography.pxToRem(15),
      [theme.breakpoints.down('sm')]: {
        // This will prevent zoom in Safari min font size ~ 16px
        fontSize: theme.typography.pxToRem(16),
      },
      '&::placeholder': {
        opacity: 1,
        color: theme.palette.text.disabled,
      },
    }),
  },
};

// ----------------------------------------------------------------------

const MuiInput: Components<Theme>['MuiInput'] = {
  /** **************************************
   * STYLE
   *************************************** */
  styleOverrides: {
    underline: ({ theme }) => ({
      '&::before': { borderBottomColor: appAlpha(theme.palette.grey['500'], 0.32) },
      '&::after': { borderBottomColor: theme.palette.text.primary },
    }),
  },
};

// ----------------------------------------------------------------------

const MuiOutlinedInput: Components<Theme>['MuiOutlinedInput'] = {
  /** **************************************
   * STYLE
   *************************************** */
  styleOverrides: {
    root: ({ theme }) => ({
      [`&.${outlinedInputClasses.focused}`]: {
        [`& .${outlinedInputClasses.notchedOutline}`]: {
          borderColor: theme.palette.text.primary,
        },
      },
      [`&.${outlinedInputClasses.error}`]: {
        [`& .${outlinedInputClasses.notchedOutline}`]: {
          borderColor: theme.palette.error.main,
        },
      },
      [`&.${outlinedInputClasses.disabled}`]: {
        [`& .${outlinedInputClasses.notchedOutline}`]: {
          borderColor: theme.palette.action.disabledBackground,
        },
      },
    }),
    notchedOutline: ({ theme }) => ({
      borderColor: appAlpha(theme.palette.grey['500'], 0.2),
      transition: theme.transitions.create(['border-color'], {
        duration: theme.transitions.duration.shortest,
      }),
    }),
  },
};

// ----------------------------------------------------------------------

const MuiFilledInput: Components<Theme>['MuiFilledInput'] = {
  /** **************************************
   * DEFAULT PROPS
   *************************************** */
  defaultProps: { disableUnderline: true },

  /** **************************************
   * STYLE
   *************************************** */
  styleOverrides: {
    root: ({ theme }) => ({
      borderRadius: theme.shape.borderRadius,
      backgroundColor: appAlpha(theme.palette.grey['500'], 0.08),
      '&:hover': { backgroundColor: appAlpha(theme.palette.grey['500'], 0.16) },
      [`&.${filledInputClasses.focused}`]: {
        backgroundColor: appAlpha(theme.palette.grey['500'], 0.16),
      },
      [`&.${filledInputClasses.error}`]: {
        backgroundColor: appAlpha(theme.palette.error.main, 0.08),
        [`&.${filledInputClasses.focused}`]: {
          backgroundColor: appAlpha(theme.palette.error.main, 0.16),
        },
      },
      [`&.${filledInputClasses.disabled}`]: {
        backgroundColor: theme.palette.action.disabledBackground,
      },
    }),
  },
};

// ----------------------------------------------------------------------

export const textfield = {
  MuiInput,
  MuiInputBase,
  MuiFilledInput,
  MuiOutlinedInput,
};
