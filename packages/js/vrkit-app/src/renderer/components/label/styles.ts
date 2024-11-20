import type { Theme } from '@mui/material/styles';

import Box from '@mui/material/Box';
import { styled } from '@mui/material/styles';

import { appAlpha, stylesMode } from 'vrkit-app-renderer/theme/styles';

import type { LabelColor, LabelVariant } from './types';
import { CreateStyledComponent } from "@emotion/styled"
import { PropsOf } from "@emotion/react"

// ----------------------------------------------------------------------

export const StyledLabel:any = styled(Box)(({
  theme,
  ownerState: { color, variant },
}: {
  theme: Theme;
  ownerState: {
    color: LabelColor;
    variant: LabelVariant;
  };
}) => {
  const defaultColor = {
    ...(color === 'default' && {
      /**
       * @variant filled
       */
      ...(variant === 'filled' && {
        color: theme.palette.common.white,
        backgroundColor: theme.palette.text.primary,
        [stylesMode.dark]: { color: theme.palette.grey[800] },
      }),
      /**
       * @variant outlined
       */
      ...(variant === 'outlined' && {
        backgroundColor: 'transparent',
        color: theme.palette.text.primary,
        border: `2px solid ${theme.palette.text.primary}`,
      }),
      /**
       * @variant soft
       */
      ...(variant === 'soft' && {
        color: theme.palette.text.secondary,
        backgroundColor: appAlpha(theme.palette.grey['500'], 0.16),
      }),
      /**
       * @variant inverted
       */
      ...(variant === 'inverted' && {
        color: theme.palette.grey[800],
        backgroundColor: theme.palette.grey[300],
      }),
    }),
  } as any;

  const styleColors = {
    ...(color !== 'default' && {
      /**
       * @variant filled
       */
      ...(variant === 'filled' && {
        color: theme.palette[color].contrastText,
        backgroundColor: theme.palette[color].main,
      }),
      /**
       * @variant outlined
       */
      ...(variant === 'outlined' && {
        backgroundColor: 'transparent',
        color: theme.palette[color].main,
        border: `2px solid ${theme.palette[color].main}`,
      }),
      /**
       * @variant soft
       */
      ...(variant === 'soft' && {
        color: theme.palette[color].dark,
        backgroundColor: appAlpha(theme.palette[color].main, 0.16),
        [stylesMode.dark]: { color: theme.palette[color].light },
      }),
      /**
       * @variant inverted
       */
      ...(variant === 'inverted' && {
        color: theme.palette[color].darker,
        backgroundColor: theme.palette[color].lighter,
      }),
    }),
  };

  return {
    height: 24,
    minWidth: 24,
    lineHeight: 0,
    cursor: 'default',
    alignItems: 'center',
    whiteSpace: 'nowrap',
    display: 'inline-flex',
    justifyContent: 'center',
    padding: theme.spacing(0, 0.75),
    fontSize: theme.typography.pxToRem(12),
    fontWeight: theme.typography.fontWeightBold,
    borderRadius: theme.shape.borderRadius * 0.75,
    transition: theme.transitions.create('all', {
      duration: theme.transitions.duration.shorter,
    }),
    ...defaultColor,
    ...styleColors,
  };
});
