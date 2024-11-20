import type { Theme, Components, ComponentsVariants } from '@mui/material/styles';

import { paginationItemClasses } from '@mui/material/PaginationItem';

import { appAlpha, stylesMode } from '../../styles';

// ----------------------------------------------------------------------

// NEW VARIANT
declare module '@mui/material/Pagination' {
  interface PaginationPropsVariantOverrides {
    soft: true;
  }

  interface PaginationPropsColorOverrides {
    info: true;
    success: true;
    warning: true;
    error: true;
  }
}

const COLORS = ['primary', 'secondary', 'info', 'success', 'warning', 'error'] as const;

// ----------------------------------------------------------------------

const softVariant: Record<string, ComponentsVariants<Theme>['MuiPagination']> = {
  colors: COLORS.map((color) => ({
    props: ({ ownerState }) =>
      !ownerState.disabled && ownerState.variant === 'soft' && ownerState.color === color,
    style: ({ theme }) => ({
      [`& .${paginationItemClasses.root}`]: {
        [`&.${paginationItemClasses.selected}`]: {
          fontWeight: theme.typography.fontWeightSemiBold,
          color: theme.palette[color].dark,
          backgroundColor: appAlpha(theme.palette[color].main, 0.08),
          '&:hover': { backgroundColor: appAlpha(theme.palette[color].main, 0.16) },
          [stylesMode.dark]: { color: theme.palette[color].light },
        },
      },
    }),
  })),
  standardColor: [
    {
      props: ({ ownerState }) => ownerState.variant === 'soft' && ownerState.color === 'standard',
      style: ({ theme }) => ({
        [`& .${paginationItemClasses.root}`]: {
          [`&.${paginationItemClasses.selected}`]: {
            fontWeight: theme.typography.fontWeightSemiBold,
            backgroundColor: appAlpha(theme.palette.grey['500'], 0.08),
            '&:hover': { backgroundColor: appAlpha(theme.palette.grey['500'], 0.16) },
          },
        },
      }),
    },
  ],
};

// ----------------------------------------------------------------------

const MuiPagination: Components<Theme>['MuiPagination'] = {
  /** **************************************
   * VARIANTS
   *************************************** */
  variants: [
    /**
     * @variant soft
     */
    ...[...softVariant.standardColor!, ...softVariant.colors!],
  ],

  /** **************************************
   * STYLE
   *************************************** */
  styleOverrides: {
    /**
     * @variant text
     */
    text: ({ ownerState, theme }) => ({
      [`& .${paginationItemClasses.root}`]: {
        [`&.${paginationItemClasses.selected}`]: {
          fontWeight: theme.typography.fontWeightSemiBold,
          ...(ownerState.color === 'standard' && {
            color: theme.palette.common.white,
            backgroundColor: theme.palette.text.primary,
            '&:hover': { backgroundColor: theme.palette.grey[700] },
            [stylesMode.dark]: {
              color: theme.palette.grey[800],
              '&:hover': { backgroundColor: theme.palette.grey[100] },
            },
          }),
        },
      },
    }),
    /**
     * @variant outlined
     */
    outlined: ({ ownerState, theme }) => ({
      [`& .${paginationItemClasses.root}`]: {
        borderColor: appAlpha(theme.palette.grey['500'], 0.24),
        [`&.${paginationItemClasses.selected}`]: {
          borderColor: 'currentColor',
          fontWeight: theme.typography.fontWeightSemiBold,
          ...(ownerState.color === 'standard' && {
            backgroundColor: appAlpha(theme.palette.grey['500'], 0.08),
          }),
        },
      },
    }),
  },
};

// ----------------------------------------------------------------------

export const pagination = { MuiPagination };
