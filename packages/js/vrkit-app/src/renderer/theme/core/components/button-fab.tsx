import type { Theme, Components, ComponentsVariants } from '@mui/material/styles';

import { fabClasses } from '@mui/material/Fab';

import { appAlpha, stylesMode } from '../../styles';

// ----------------------------------------------------------------------

// NEW VARIANT
declare module '@mui/material/Fab' {
  interface FabPropsVariantOverrides {
    outlined: true;
    outlinedExtended: true;
    soft: true;
    softExtended: true;
  }
}

const COLORS = ['primary', 'secondary', 'info', 'success', 'warning', 'error'] as const;

const DEFAULT_COLORS = ['default', 'inherit'];
const EXTENDED_VARIANT = ['extended', 'outlinedExtended', 'softExtended'];
const FILLED_VARIANT = ['circular', 'extended'];
const OUTLINED_VARIANT = ['outlined', 'outlinedExtended'];
const SOFT_VARIANT = ['soft', 'softExtended'];

// ----------------------------------------------------------------------

const filledVariant: Record<string, ComponentsVariants<Theme>['MuiFab']> = {
  colors: COLORS.map((color) => ({
    props: ({ ownerState }) =>
      !ownerState.disabled &&
      FILLED_VARIANT.includes(ownerState.variant!) &&
      ownerState.color === color,
    style: ({ theme }) => ({
      boxShadow: theme.customShadows[color],
      '&:hover': { boxShadow: 'none' },
    }),
  })),
  base: [
    {
      props: ({ ownerState }) =>
        FILLED_VARIANT.includes(ownerState.variant!) && DEFAULT_COLORS.includes(ownerState.color!),
      style: ({ theme }) => ({
        boxShadow: theme.customShadows.z8,
        /**
         * @color default
         */
        color: theme.palette.grey[800],
        backgroundColor: theme.palette.grey[300],
        '&:hover': { boxShadow: 'none', backgroundColor: theme.palette.grey[400] },
        /**
         * @color inherit
         */
        [`&.${fabClasses.colorInherit}`]: {
          color: theme.palette.common.white,
          backgroundColor: theme.palette.text.primary,
          '&:hover': { backgroundColor: theme.palette.grey[700] },
          [stylesMode.dark]: {
            color: theme.palette.grey[800],
            '&:hover': { backgroundColor: theme.palette.grey[400] },
          },
        },
      }),
    },
  ],
};

const outlinedVariant: Record<string, ComponentsVariants<Theme>['MuiFab']> = {
  colors: COLORS.map((color) => ({
    props: ({ ownerState }) =>
      !ownerState.disabled &&
      OUTLINED_VARIANT.includes(ownerState.variant!) &&
      ownerState.color === color,
    style: ({ theme }) => ({
      color: theme.palette[color].main,
      border: `solid 1px ${appAlpha(theme.palette[color].main, 0.48)}`,
      '&:hover': { backgroundColor: appAlpha(theme.palette[color].main, 0.08) },
    }),
  })),
  base: [
    {
      props: ({ ownerState }) => OUTLINED_VARIANT.includes(ownerState.variant!),
      style: ({ theme }) => ({
        boxShadow: 'none',
        backgroundColor: 'transparent',
        color: theme.palette.text.secondary,
        border: `solid 1px ${appAlpha(theme.palette.grey['500'], 0.32)}`,
        '&:hover': {
          borderColor: 'currentColor',
          boxShadow: '0 0 0 0.75px currentColor',
          backgroundColor: theme.palette.action.hover,
        },
        [`&.${fabClasses.colorInherit}`]: { color: theme.palette.text.primary },
        [`&.${fabClasses.disabled}`]: {
          backgroundColor: 'transparent',
          border: `1px solid ${theme.palette.action.disabledBackground}`,
        },
      }),
    },
  ],
};

const softVariant: Record<string, ComponentsVariants<Theme>['MuiFab']> = {
  colors: COLORS.map((color) => ({
    props: ({ ownerState }) =>
      !ownerState.disabled &&
      SOFT_VARIANT.includes(ownerState.variant!) &&
      ownerState.color === color,
    style: ({ theme }) => ({
      boxShadow: 'none',
      color: theme.palette[color].dark,
      backgroundColor: appAlpha(theme.palette[color].main, 0.16),
      '&:hover': {
        boxShadow: 'none',
        backgroundColor: appAlpha(theme.palette[color].main, 0.32),
      },
      [stylesMode.dark]: { color: theme.palette[color].light },
    }),
  })),
  base: [
    {
      props: ({ ownerState }) =>
        SOFT_VARIANT.includes(ownerState.variant!) && DEFAULT_COLORS.includes(ownerState.color!),
      style: ({ theme }) => ({
        /**
         * @color default
         */
        boxShadow: 'none',
        color: theme.palette.grey[800],
        backgroundColor: theme.palette.grey[300],
        '&:hover': { boxShadow: 'none', backgroundColor: theme.palette.grey[400] },
        /**
         * @color inherit
         */
        [`&.${fabClasses.colorInherit}`]: {
          color: theme.palette.text.primary,
          backgroundColor: appAlpha(theme.palette.grey['500'], 0.08),
          '&:hover': { backgroundColor: appAlpha(theme.palette.grey['500'], 0.24) },
        },
      }),
    },
  ],
};

const sizes: ComponentsVariants<Theme>['MuiFab'] = [
  {
    props: ({ ownerState }) => EXTENDED_VARIANT.includes(ownerState.variant!),
    style: ({ theme }) => ({
      height: 48,
      width: 'auto',
      minHeight: 48,
      borderRadius: 48 / 2,
      gap: theme.spacing(1),
      padding: theme.spacing(0, 2),
      [`&.${fabClasses.sizeSmall}`]: {
        height: 34,
        minHeight: 34,
        borderRadius: 34 / 2,
        gap: theme.spacing(0.5),
        padding: theme.spacing(0, 1),
      },
      [`&.${fabClasses.sizeMedium}`]: { height: 40, minHeight: 40, borderRadius: 40 / 2 },
    }),
  },
];

const MuiFab: Components<Theme>['MuiFab'] = {
  /** **************************************
   * DEFAULT PROPS
   *************************************** */
  defaultProps: { color: 'primary' },

  /** **************************************
   * VARIANTS
   *************************************** */
  variants: [
    /**
     * @variant filled
     */
    ...[...filledVariant.base!, ...filledVariant.colors!],
    /**
     * @variant outlined
     */
    ...[...outlinedVariant.base!, ...outlinedVariant.colors!],
    /**
     * @variant soft
     */
    ...[...softVariant.base!, ...softVariant.colors!],
    /**
     * @sizes
     */
    ...sizes,
  ],

  /** **************************************
   * STYLE
   *************************************** */
  styleOverrides: {},
};

// ----------------------------------------------------------------------

export const fab = { MuiFab };
