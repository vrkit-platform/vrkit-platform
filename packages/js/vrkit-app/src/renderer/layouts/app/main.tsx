import type { BoxProps } from '@mui/material/Box';
import type { Breakpoint } from '@mui/material/styles';
import type { ContainerProps } from '@mui/material/Container';

import Box from '@mui/material/Box';
import { useTheme } from '@mui/material/styles';
import Container from '@mui/material/Container';

import { layoutClasses } from 'vrkit-app-renderer/layouts/classes';

import { useSettingsContext } from 'vrkit-app-renderer/components/settings';

// ----------------------------------------------------------------------

type MainProps = BoxProps & {

};

export function Main({ children, sx, ...other }: MainProps) {
  return (
    <Box
      component="main"
      className={layoutClasses.main}
      sx={{
        display: 'flex',
        flex: '1 1 auto',
        flexDirection: 'column',
        ...sx,
      }}
      {...other}
    >
      {children}
    </Box>
  );
}

// ----------------------------------------------------------------------

type AppContentProps = ContainerProps & {
  disablePadding?: boolean;
};

export function AppContent({
  sx,
  children,
  disablePadding,
  maxWidth = 'lg',
  ...other
}: AppContentProps) {
  const theme = useTheme();

  const settings = useSettingsContext();

  const layoutQuery: Breakpoint = 'lg';

  return (
    <Container
      className={layoutClasses.content}
      maxWidth={settings.compactLayout ? maxWidth : false}
      sx={{
        display: 'flex',
        flex: '1 1 auto',
        flexDirection: 'column',
        pt: 'var(--layout-dashboard-content-pt)',
        pb: 'var(--layout-dashboard-content-pb)',
        [theme.breakpoints.up(layoutQuery)]: {
          px: 'var(--layout-dashboard-content-px)',
        },
        ...(disablePadding && {
          p: {
            xs: 0,
            sm: 0,
            md: 0,
            lg: 0,
            xl: 0,
          },
        }),
        ...sx,
      }}
      {...other}
    >
      {children}
    </Container>
  );
}
