import GlobalStyles from "@mui/material/GlobalStyles"
import { SxProps, useTheme } from "@mui/material/styles"

import React, { useState } from "react"

import Box from "@mui/material/Box"
import {
  FillHeight,
  FillWindow,
  flex,
  flexAlign,
  FlexColumn,
  FlexRow,
  FlexScaleZero,
  OverflowHidden,
  widthConstraint
} from "@vrkit-platform/shared-ui"
import Drawer from "@mui/material/Drawer"
import AppDrawerMenu from "../app-drawer-menu"
import { AppTitlebar } from "../app-titlebar"
import { AppContentBar } from "../app-content-bar"
import { AppSessionPlayerControlPanel } from "../app-session-player-control-panel"

export type AppLayoutProps = {
  sx?: SxProps
  children: React.ReactNode
}

export function AppLayout({ sx, children, ...other }: AppLayoutProps) {
  const theme = useTheme(),
    [isDrawerOpen, setDrawerOpen] = useState(true),
    toggleDrawer = (newOpen: boolean) => () => {
      setDrawerOpen(newOpen)
    }

  return (
    <>
      <GlobalStyles
        styles={{
          body: {
            [`& > #root`]: {
              ...FlexColumn,
              ...FillWindow,
              ...OverflowHidden
            }
          }
        }}
      />
      <AppTitlebar />

      <Box
        component="main"
        sx={{
          ...FlexRow,
          ...flexAlign("stretch", "stretch"),
          ...FlexScaleZero,
          ...widthConstraint("100vw"),
          ...OverflowHidden,
          backgroundColor: "transparent",
          ...sx
        }}
      >
        <Drawer
          variant="permanent"
          open={isDrawerOpen}
          onClose={toggleDrawer(false)}
          sx={{
            position: "relative",
            ...flex(0, 1, "calc(min(300px,25vw))"),
            ...FlexColumn,
            ...flexAlign("stretch", "stretch"),

            [`& .MuiDrawer-paper`]: {
              position: "relative"
            }
          }}
        >
          <AppDrawerMenu />
        </Drawer>
        <Box
          sx={{
            ...FlexScaleZero,
            ...OverflowHidden,
            ...FillHeight,
            ...FlexColumn,
            ...flexAlign("stretch")
          }}
        >
          <AppContentBar />
          {children}
        </Box>
      </Box>
      <AppSessionPlayerControlPanel />
    </>
  )
}
