import GlobalStyles from "@mui/material/GlobalStyles"
import { useSettingsContext } from "vrkit-app-renderer/components/settings"
import type { NavSectionProps } from "vrkit-app-renderer/components/nav-section"
import { styled, SxProps, Theme, useTheme } from "@mui/material/styles"

import React from "react"

import Alert from "@mui/material/Alert"

import { useBoolean } from "vrkit-app-renderer/hooks/use-boolean"

import { Main } from "./main"
import { navData as dashboardNavData } from "../nav-data"
import { Logo } from "../../components/logo"
import { AppTitleBar } from "../core/AppTitleBar"
import MainAppBar from "../core/MainAppBar"

const StyledDivider = styled("span")(({ theme }) => ({
  width: 1,
  height: 10,
  flexShrink: 0,
  display: "none",
  position: "relative",
  alignItems: "center",
  flexDirection: "column",
  marginLeft: theme.spacing(2.5),
  marginRight: theme.spacing(2.5),
  backgroundColor: "currentColor",
  color: theme.vars.palette.divider,
  "&::before, &::after": {
    top: -5,
    width: 3,
    height: 3,
    content: '""',
    flexShrink: 0,
    borderRadius: "50%",
    position: "absolute",
    backgroundColor: "currentColor"
  },
  "&::after": { bottom: -5, top: "auto" }
}))

// ----------------------------------------------------------------------

export type AppLayoutProps = {
  sx?: SxProps<Theme>
  children: React.ReactNode
  data?: {
    nav?: NavSectionProps["data"]
  }
}

export function AppLayout({ sx, children, data }: AppLayoutProps) {
  const theme = useTheme()

  const mobileNavOpen = useBoolean()

  const settings = useSettingsContext()

  const navData = data?.nav ?? dashboardNavData

  // const isNavVertical = isNavMini || settings.navLayout === 'vertical';

  return (
    <>
      <GlobalStyles
        styles={{
          body: {}
        }}
      />
      <MainAppBar />
      {/*<AppTitleBar*/}
      {/*  slots={{*/}
      {/*    leftArea: <Logo data-slot="logo" />,*/}
      {/*    //<Logo data-slot="logo" />*/}
      {/*    topArea: (*/}
      {/*      <>*/}
      {/*        <Alert*/}
      {/*          severity="info"*/}
      {/*          sx={{ display: "none", borderRadius: 0 }}*/}
      {/*        >*/}
      {/*          This is an info Alert.*/}
      {/*        </Alert>*/}
      {/*      </>*/}
      {/*    )*/}
      {/*  }}*/}
      {/*  slotProps={{*/}
      {/*    toolbar: {*/}
      {/*      sx: {}*/}
      {/*    },*/}
      {/*    container: {*/}
      {/*      sx: {*/}
      {/*        //px: { [layoutQuery]: 5 } ,*/}
      {/*      }*/}
      {/*    }*/}
      {/*  }}*/}
      {/*/>*/}

      <Main>{children}</Main>
      {/*<LayoutSection*/}

      {/*  headerSection={*/}
      {/*    <HeaderBase*/}

      {/*    />*/}
      {/*  }*/}
      {/*  /** ***************************************/}
      {/*   * Sidebar*/}

      {/*  // sidebarSection={*/}
      {/*  //*/}
      {/*  //     <NavVertical*/}
      {/*  //       data={navData}*/}
      {/*  //       layoutQuery={layoutQuery}*/}
      {/*  //       cssVars={navColorVars.section}*/}
      {/*  //       onToggleNav={() =>*/}
      {/*  //         settings.onUpdateField(*/}
      {/*  //           'navLayout',*/}
      {/*  //           settings.navLayout === 'vertical' ? 'mini' : 'vertical'*/}
      {/*  //         )*/}
      {/*  //       }*/}
      {/*  //     />*/}
      {/*  //*/}
      {/*  // }*/}

      {/*  footerSection={null}*/}

      {/*  cssVars={{*/}
      {/*  */}
      {/*  }}*/}
      {/*  sx={{*/}
      {/*    ...sx,*/}
      {/*  }}*/}
      {/*>*/}
      {/*  <Main>{children}</Main>*/}
      {/*</LayoutSection>*/}
    </>
  )
}
