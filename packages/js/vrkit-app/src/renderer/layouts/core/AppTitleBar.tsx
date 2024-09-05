import type { Breakpoint } from '@mui/material/styles';
import type { AppBarProps } from '@mui/material/AppBar';
import type { ToolbarProps } from '@mui/material/Toolbar';
import type { ContainerProps } from '@mui/material/Container';

import Box, { BoxProps } from "@mui/material/Box"
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Container from '@mui/material/Container';
import { styled, useTheme } from '@mui/material/styles';

import { useScrollOffSetTop } from 'vrkit-app-renderer/hooks/use-scroll-offset-top';

import { bgBlur, varAlpha } from 'vrkit-app-renderer/theme/styles';
import React from "react"
import { useAppSelector } from "../../services/store"
import {
  sessionManagerSelectors
} from "../../services/store/slices/session-manager"


// ----------------------------------------------------------------------

const StyledElevation = styled('span')(({ theme }) => ({
  left: 0,
  right: 0,
  bottom: 0,
  m: 'auto',
  height: 24,
  zIndex: -1,
  opacity: 0.48,
  borderRadius: '50%',
  position: 'absolute',
  width: `calc(100% - 48px)`,
  boxShadow: theme.customShadows.z8,
}));

// ----------------------------------------------------------------------

export interface AppTitleBarProps extends AppBarProps {
  slots?: {
    leftArea?: React.ReactNode;
    leftAreaEnd?: React.ReactNode;
    leftAreaStart?: React.ReactNode;
    rightArea?: React.ReactNode;
    rightAreaEnd?: React.ReactNode;
    rightAreaStart?: React.ReactNode;
    topArea?: React.ReactNode;
    centerArea?: React.ReactNode;
    bottomArea?: React.ReactNode;
  };
  slotProps?: {
    toolbar?: ToolbarProps;
    container?: BoxProps;
  };
};

export function AppTitleBar({
  sx,
  slots,
  slotProps,
  ...other
}: AppTitleBarProps) {
  const theme = useTheme();

  const { offsetTop } = useScrollOffSetTop();
  
  const isLiveConnected = useAppSelector(sessionManagerSelectors.isLiveSessionAvailable)
  const activeSession = useAppSelector(sessionManagerSelectors.selectActiveSession)

  const toolbarStyles = {
    default: {
      minHeight: '4rem',
      height: '4rem',
      transition: theme.transitions.create(['height', 'background-color'], {
        easing: theme.transitions.easing.easeInOut,
        duration: theme.transitions.duration.shorter,
      }),
    },
    offset: {
      ...bgBlur({ color: varAlpha(theme.vars.palette.background.defaultChannel, 0.8) }),
    },
  };

  return (
    <AppBar
      position="sticky"
      elevation={5}
      sx={{
        zIndex: 5,
        ...sx,
      }}
      {...other}
    >
      {slots?.topArea}

      <Toolbar
        disableGutters
        {...slotProps?.toolbar}
        sx={{
        
        }}
      >
        <Box
          {...slotProps?.container}
          sx={{
            height: 1,
            display: 'flex',
            alignItems: 'center',
            ...slotProps?.container?.sx,
          }}
        >
          {slots?.leftArea}

          <Box sx={{ display: 'flex', flex: '1 1 auto', justifyContent: 'center' }}>
            {slots?.centerArea}
          </Box>

          {slots?.rightArea}
        </Box>
      </Toolbar>

      {slots?.bottomArea}

      <StyledElevation />
    </AppBar>
  );
}
