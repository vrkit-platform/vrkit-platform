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
import NavDrawer from "./NavDrawer"
import { useWebPathRoot, WebRootPath } from "../../routes/WebPaths"

export type PageLayoutProps = {
  sx?: SxProps
  children: React.ReactNode
}

export function PageLayout({ sx, children, ...other }: PageLayoutProps) {
  const rootPath = useWebPathRoot(),
    isMain = rootPath === WebRootPath.main
  

  return (
    <>
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
        <If condition={isMain}>
          <NavDrawer />
        </If>
        <Box
          sx={{
            ...FlexScaleZero,
            ...OverflowHidden,
            ...FillHeight,
            ...FlexColumn,
            ...flexAlign("stretch")
          }}
        >
          <If condition={isMain}>
            <AppContentBar />
          </If>
          {children}
        </Box>
      </Box>
      <If condition={isMain}>
        <AppSessionPlayerControlPanel />
      </If>
    </>
  )
}
