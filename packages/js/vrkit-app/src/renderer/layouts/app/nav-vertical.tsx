import type { Breakpoint } from '@mui/material/styles';
import type { NavSectionProps } from 'vrkit-app-renderer/components/nav-section';

import Box from '@mui/material/Box';
import { useTheme } from '@mui/material/styles';

import { varAlpha, hideScrollY } from 'vrkit-app-renderer/theme/styles';

import { Logo } from 'vrkit-app-renderer/components/logo';
import { Scrollbar } from 'vrkit-app-renderer/components/scrollbar';
import { NavSection } from 'vrkit-app-renderer/components/nav-section';

import { NavToggleButton } from '../components/nav-toggle-button';
import React from "react"

// ----------------------------------------------------------------------

export type NavVerticalProps = NavSectionProps & {
  
  layoutQuery: Breakpoint;
  onToggleNav: () => void;
  slots?: {
    topArea?: React.ReactNode;
    bottomArea?: React.ReactNode;
  };
};

export function NavVertical({
  sx,
  data,
  slots,
  layoutQuery,
  onToggleNav,
  ...other
}: NavVerticalProps) {
  const theme = useTheme();


  return (
    <Box
      sx={{
        top: 0,
        left: 0,
        height: 1,
        display: 'none',
        position: 'fixed',
        flexDirection: 'column',
        bgcolor: 'var(--layout-nav-bg)',
        zIndex: 'var(--layout-nav-zIndex)',
        width: 'var(--layout-nav-vertical-width)',
        borderRight: `1px solid var(--layout-nav-border-color, ${varAlpha(theme.vars.palette.grey['500Channel'], 0.12)})`,
        transition: theme.transitions.create(['width'], {
          easing: 'var(--layout-transition-easing)',
          duration: 'var(--layout-transition-duration)',
        }),
        [theme.breakpoints.up(layoutQuery)]: {
          display: 'flex',
        },
        ...sx,
      }}
    >
      <NavToggleButton
        onClick={onToggleNav}
        sx={{
          display: 'none',
          [theme.breakpoints.up(layoutQuery)]: {
            display: 'inline-flex',
          },
        }}
      />
      
        {slots?.topArea ?? (
            <Box sx={{ pl: 3.5, pt: 2.5, pb: 1 }}>
              <Logo />
            </Box>
        )}
        
        <Scrollbar fillContent>
          <NavSection data={data} sx={{ px: 2, flex: '1 1 auto' }} {...other} />
        
        </Scrollbar>
      
    </Box>
  );
}
