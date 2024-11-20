import { Toaster } from 'sonner';

import { styled } from '@mui/material/styles';

import { appAlpha } from 'vrkit-app-renderer/theme/styles';

import { toasterClasses } from './classes';

// ----------------------------------------------------------------------

export const StyledToaster = styled(Toaster)(({ theme }) => {
  const baseStyles = {
    toastDefault: {
      padding: theme.spacing(1, 1, 1, 1.5),
      boxShadow: theme.customShadows.z8,
      color: theme.palette.background.paper,
      backgroundColor: theme.palette.text.primary,
    },
    toastColor: {
      padding: theme.spacing(0.5, 1, 0.5, 0.5),
      boxShadow: theme.customShadows.z8,
      color: theme.palette.text.primary,
      backgroundColor: theme.palette.background.paper,
    },
    toastLoader: {
      padding: theme.spacing(0.5, 1, 0.5, 0.5),
      boxShadow: theme.customShadows.z8,
      color: theme.palette.text.primary,
      backgroundColor: theme.palette.background.paper,
    },
  };

  const loadingStyles = {
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    display: 'none',
    transform: 'none',
    overflow: 'hidden',
    alignItems: 'center',
    position: 'relative',
    borderRadius: 'inherit',
    justifyContent: 'center',
    background: theme.palette.background.neutral,
    [`& .${toasterClasses.loadingIcon}`]: {
      zIndex: 9,
      width: 24,
      height: 24,
      borderRadius: '50%',
      animation: 'rotate 3s infinite linear',
      background: `conic-gradient(${appAlpha(theme.palette.text.primary, 0)}, ${appAlpha(theme.palette.text.disabledChannel, 0.64)})`,
    },
    [toasterClasses.loaderVisible]: { display: 'flex' },
  };

  return {
    width: 300,
    [`& .${toasterClasses.toast}`]: {
      gap: 12,
      width: '100%',
      minHeight: 52,
      display: 'flex',
      borderRadius: 12,
      alignItems: 'center',
    },
    /*
     * Content
     */
    [`& .${toasterClasses.content}`]: {
      gap: 0,
      flex: '1 1 auto',
    },
    [`& .${toasterClasses.title}`]: {
      fontSize: theme.typography.subtitle2.fontSize,
    },
    [`& .${toasterClasses.description}`]: {
      ...theme.typography.caption,
      opacity: 0.64,
    },
    /*
     * Buttons
     */
    [`& .${toasterClasses.actionButton}`]: {},
    [`& .${toasterClasses.cancelButton}`]: {},
    [`& .${toasterClasses.closeButton}`]: {
      top: 0,
      right: 0,
      left: 'auto',
      color: 'currentColor',
      backgroundColor: 'transparent',
      transform: 'translate(-6px, 6px)',
      borderColor: appAlpha(theme.palette.grey['500'], 0.16),
      transition: theme.transitions.create(['background-color', 'border-color']),
      '&:hover': {
        borderColor: appAlpha(theme.palette.grey['500'], 0.24),
        backgroundColor: appAlpha(theme.palette.grey['500'], 0.08),
      },
    },
    /*
     * Icon
     */
    [`& .${toasterClasses.icon}`]: {
      margin: 0,
      width: 48,
      height: 48,
      alignItems: 'center',
      borderRadius: 'inherit',
      justifyContent: 'center',
      alignSelf: 'flex-start',
      [`& .${toasterClasses.iconSvg}`]: {
        width: 24,
        height: 24,
        fontSize: 0,
      },
    },

    /*
     * Default
     */
    '@keyframes rotate': { to: { transform: 'rotate(1turn)' } },

    [`& .${toasterClasses.default}`]: {
      ...baseStyles.toastDefault,
      [`&:has(${toasterClasses.closeBtnVisible})`]: {
        [`& .${toasterClasses.content}`]: {
          paddingRight: 32,
        },
      },
      [`&:has(.${toasterClasses.loader})`]: baseStyles.toastLoader,
      /*
       * With loader
       */
      [`&:has(.${toasterClasses.loader})`]: baseStyles.toastLoader,
      [`& .${toasterClasses.loader}`]: loadingStyles,
    },
    /*
     * Error
     */
    [`& .${toasterClasses.error}`]: {
      ...baseStyles.toastColor,
      [`& .${toasterClasses.icon}`]: {
        color: theme.palette.error.main,
        backgroundColor: appAlpha(theme.palette.error.main, 0.08),
      },
    },
    /*
     * Success
     */
    [`& .${toasterClasses.success}`]: {
      ...baseStyles.toastColor,
      [`& .${toasterClasses.icon}`]: {
        color: theme.palette.success.main,
        backgroundColor: appAlpha(theme.palette.success.main, 0.08),
      },
    },
    /*
     * Warning
     */
    [`& .${toasterClasses.warning}`]: {
      ...baseStyles.toastColor,
      [`& .${toasterClasses.icon}`]: {
        color: theme.palette.warning.main,
        backgroundColor: appAlpha(theme.palette.warning.main, 0.08),
      },
    },
    /*
     * Info
     */
    [`& .${toasterClasses.info}`]: {
      ...baseStyles.toastColor,
      [`& .${toasterClasses.icon}`]: {
        color: theme.palette.info.main,
        backgroundColor: appAlpha(theme.palette.info.main, 0.08),
      },
    },
  };
});
