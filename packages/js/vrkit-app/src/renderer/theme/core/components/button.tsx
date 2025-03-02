import type { ButtonProps } from '@mui/material/Button';
import type { Theme, CSSObject, Components, ComponentsVariants } from '@mui/material/styles';

import { buttonClasses } from '@mui/material/Button';
import { loadingButtonClasses } from '@mui/lab/LoadingButton';

import { appAlpha, stylesMode } from '../../styles';
import { padding, rem } from "@vrkit-platform/shared-ui"

// ----------------------------------------------------------------------

// NEW VARIANT
declare module '@mui/material/Button' {
  interface ButtonPropsVariantOverrides {
    soft: true;
  }
}

const COLORS = ['primary', 'secondary', 'info', 'success', 'warning', 'error'] as const;

type ColorType = (typeof COLORS)[number];

function styleColors(ownerState: ButtonProps, styles: (val: ColorType) => CSSObject) {
  const outputStyle = COLORS.reduce((acc, color) => {
    if (!ownerState.disabled && ownerState.color === color) {
      acc = styles(color);
    }
    return acc;
  }, {});

  return outputStyle;
}

// ----------------------------------------------------------------------

const MuiButtonBase: Components<Theme>['MuiButtonBase'] = {
  /** **************************************
   * STYLE
   *************************************** */
  styleOverrides: { root: ({ theme }) => ({ fontFamily: theme.typography.fontFamily }) },
};

// ----------------------------------------------------------------------

const softVariant: Record<string, ComponentsVariants<Theme>['MuiButton']> = {
  colors: COLORS.map((color) => ({
    props: ({ ownerState }) =>
      !ownerState.disabled && ownerState.variant === 'soft' && ownerState.color === color,
    style: ({ theme }) => ({
      color: theme.palette[color].dark,
      backgroundColor: appAlpha(theme.palette[color].main, 0.16),
      '&:hover': { backgroundColor: appAlpha(theme.palette[color].main, 0.32) },
      [stylesMode.dark]: { color: theme.palette[color].light },
    }),
  })),
  base: [
    {
      props: ({ ownerState }) => ownerState.variant === 'soft',
      style: ({ theme }) => ({
        minWidth: "auto",
        backgroundColor: appAlpha(theme.palette.grey['500'], 0.08),
        '&:hover': { backgroundColor: appAlpha(theme.palette.grey['500'], 0.24) },
        [`&.${buttonClasses.disabled}`]: {
          backgroundColor: theme.palette.action.disabledBackground,
        },
        [`& .${loadingButtonClasses.loadingIndicatorStart}`]: { left: 14 },
        [`& .${loadingButtonClasses.loadingIndicatorEnd}`]: { right: 14 },
        [`&.${buttonClasses.sizeSmall}`]: {
          [`& .${loadingButtonClasses.loadingIndicatorStart}`]: { left: 10 },
          [`& .${loadingButtonClasses.loadingIndicatorEnd}`]: { right: 10 },
        },
      }),
    },
  ],
};

const MuiButton: Components<Theme>['MuiButton'] = {
  /** **************************************
   * DEFAULT PROPS
   *************************************** */
  defaultProps: { color: 'inherit', disableElevation: true },

  /** **************************************
   * VARIANTS
   *************************************** */
  variants: [
    /**
     * @variant soft
     */
    ...[...softVariant.base!, ...softVariant.colors!],
  ],

  /** **************************************
   * STYLE
   *************************************** */
  styleOverrides: {
    root: {
      minWidth: "auto",
      height: "auto"
    },
    /**
     * @variant contained
     */
    // contained: ({ theme, ownerState }) => {
    //   const styled = {
    //     colors: styleColors(ownerState, (color) => ({
    //       '&:hover': { boxShadow: theme.customShadows[color] },
    //     })),
    //     inheritColor: {
    //       ...(ownerState.color === 'inherit' &&
    //         !ownerState.disabled && {
    //           color: theme.palette.common.white,
    //           backgroundColor: theme.palette.grey[800],
    //           '&:hover': {
    //             boxShadow: theme.customShadows.z8,
    //             backgroundColor: theme.palette.grey[700],
    //           },
    //           [stylesMode.dark]: {
    //             color: theme.palette.grey[800],
    //             backgroundColor: theme.palette.common.white,
    //             '&:hover': { backgroundColor: theme.palette.grey[400] },
    //           },
    //         }),
    //     },
    //   };
    //   return { ...styled.inheritColor, ...styled.colors };
    // },
    /**
     * @variant outlined
     */
    // outlined: ({ theme, ownerState }) => {
    //   const styled = {
    //     colors: styleColors(ownerState, (color) => ({
    //       borderColor: appAlpha(theme.palette[color].main, 0.48),
    //     })),
    //     inheritColor: {
    //       ...(ownerState.color === 'inherit' &&
    //         !ownerState.disabled && {
    //           borderColor: appAlpha(theme.palette.grey['500'], 0.32),
    //           '&:hover': { backgroundColor: theme.palette.action.hover },
    //         }),
    //     },
    //     base: {
    //       '&:hover': { borderColor: 'currentColor', boxShadow: '0 0 0 0.75px currentColor' },
    //     },
    //   };
    //   return { ...styled.base, ...styled.inheritColor, ...styled.colors };
    // },
    // /**
    //  * @variant text
    //  */
    // text: ({ ownerState, theme }) => {
    //   const styled = {
    //     inheritColor: {
    //       ...(ownerState.color === 'inherit' &&
    //         !ownerState.disabled && {
    //           '&:hover': { backgroundColor: theme.palette.action.hover },
    //         }),
    //     },
    //   };
    //   return { ...styled.inheritColor };
    // },
    // /**
    //  * @size
    //  */
    sizeSmall: ({ ownerState, theme }) => ({
      height: rem(1),
      fontSize: rem(0.8),
      ...(ownerState.variant === 'text'
          ? padding(theme.spacing(0.5))
          : padding(theme.spacing(1.5),theme.spacing(1.5)))
    }),
    sizeMedium: ({ ownerState, theme }) => ({
      height: rem(1.2),
      ...(ownerState.variant === 'text'
          ? padding(theme.spacing(1))
          : padding(theme.spacing(2),theme.spacing(3))),
    }),
    sizeLarge: ({ ownerState, theme }) => ({
      height: rem(1.6),
      ...(ownerState.variant === 'text'
        ? padding(theme.spacing(1.5))
        : padding(theme.spacing(2.5),theme.spacing(4)))
    }),
  },
};

// ----------------------------------------------------------------------

export const button = { MuiButtonBase, MuiButton };
