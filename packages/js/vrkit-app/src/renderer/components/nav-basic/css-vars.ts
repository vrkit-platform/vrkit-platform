import type { Theme } from '@mui/material/styles';

import { appAlpha } from 'vrkit-app-renderer/theme/styles';

// ----------------------------------------------------------------------

function desktopVars(theme: Theme) {
  const {
    shape,
    spacing,
    vars: { palette },
  } = theme;

  return {
    '--nav-item-gap': spacing(3),
    '--nav-item-radius': '0',
    '--nav-item-caption-color': palette.text.disabled,
    // root
    '--nav-item-root-padding': '0',
    '--nav-item-root-active-color': palette.primary.main,
    // sub
    '--nav-item-sub-radius': `${shape.borderRadius * 0.75}px`,
    '--nav-item-sub-padding': spacing(0.75, 1, 0.75, 1),
    '--nav-item-sub-color': palette.text.secondary,
    '--nav-item-sub-hover-color': palette.text.primary,
    '--nav-item-sub-hover-bg': palette.action.hover,
    '--nav-item-sub-active-color': palette.text.primary,
    '--nav-item-sub-active-bg': palette.action.selected,
    '--nav-item-sub-open-color': palette.text.primary,
    '--nav-item-sub-open-bg': palette.action.hover,
    // icon
    '--nav-icon-size': '22px',
    '--nav-icon-margin': spacing(0, 1, 0, 0),
  };
}

// ----------------------------------------------------------------------

function mobileVars(theme: Theme) {
  const {
    shape,
    spacing,
    vars: { palette },
  } = theme;

  return {
    '--nav-item-gap': spacing(0.5),
    '--nav-item-radius': `${shape.borderRadius}px`,
    '--nav-item-pt': spacing(0.5),
    '--nav-item-pl': spacing(1.5),
    '--nav-item-pr': spacing(1),
    '--nav-item-pb': spacing(0.5),
    '--nav-item-color': palette.text.secondary,
    '--nav-item-hover-color': palette.action.hover,
    '--nav-item-caption-color': palette.text.disabled,
    // root
    '--nav-item-root-height': '2rem',
    '--nav-item-root-active-color': palette.primary.main,
    '--nav-item-root-active-color-on-dark': palette.primary.light,
    '--nav-item-root-active-bg': appAlpha(palette.primary.main, 0.08),
    '--nav-item-root-active-hover-bg': appAlpha(palette.primary.main, 0.16),
    '--nav-item-root-open-color': palette.text.primary,
    '--nav-item-root-open-bg': palette.action.hover,
    // sub
    '--nav-item-sub-height': '1.5rem',
    '--nav-item-sub-active-color': palette.text.primary,
    '--nav-item-sub-active-bg': palette.action.hover,
    '--nav-item-sub-open-color': palette.text.primary,
    '--nav-item-sub-open-bg': palette.action.hover,
    // icon
    '--nav-icon-size': '1.2rem',
    '--nav-icon-margin': spacing(0, 2, 0, 0),
  };
}

// ----------------------------------------------------------------------

export const navBasicCssVars = {
  desktop: desktopVars,
  mobile: mobileVars,
};
