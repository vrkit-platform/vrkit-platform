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
import { AppTitlebar } from "../app-titlebar"
import { AppContentBar } from "../app-content-bar"
import { AppSessionPlayerControlPanel } from "../app-session-player-control-panel"
import AppDrawer from "./AppDrawer"

export type AppLayoutProps = {
  sx?: SxProps
  children: React.ReactNode
}

export function AppLayout({ sx, children, ...other }: AppLayoutProps) {
  const theme = useTheme()
  

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
        <AppDrawer />
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
