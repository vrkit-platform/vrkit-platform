import { SxProps, useTheme } from "@mui/material/styles"

import React, { useState } from "react"

import Box from "@mui/material/Box"
import {
  alpha, FillHeight,
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
import { useAppSelector } from "../../services/store"
import { sharedAppSelectors } from "../../services/store/slices/shared-app"
import Backdrop from "@mui/material/Backdrop"

export type PageLayoutProps = {
  sx?: SxProps
  children: React.ReactNode
}

export function PageLayout({ sx, children, ...other }: PageLayoutProps) {
  const rootPath = useWebPathRoot(),
    isMain = rootPath === WebRootPath.main,
    isModalActive = useAppSelector(sharedAppSelectors.hasActiveModalDesktopWindow)
  

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
        <Backdrop
          open={isModalActive}
          sx={{
            backdropFilter: `blur(6px)`,
            WebkitBackdropFilter: `blur(6px)`,
            backgroundColor: alpha("rgb(0,0,0)", 0.5),
            zIndex: 5000
          }}
        />
      </If>
    </>
  )
}
