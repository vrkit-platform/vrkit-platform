import GlobalStyles from "@mui/material/GlobalStyles"
import { useSettingsContext } from "vrkit-app-renderer/components/settings"
import type { NavSectionProps } from "vrkit-app-renderer/components/nav-section"
import { styled, SxProps, Theme, useTheme } from "@mui/material/styles"

import React from "react"

import Alert from "@mui/material/Alert"

import { useBoolean } from "vrkit-app-renderer/hooks/use-boolean"
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

import type { BoxProps } from "@mui/material/Box"
import Box from "@mui/material/Box"
import {
  dimensionConstraints,
  Fill,
  FillWidth,
  FlexColumn,
  OverflowHidden,
  widthConstraint
} from "../../styles"

// ----------------------------------------------------------------------

export type AppLayoutProps = {
  sx?: SxProps
  children: React.ReactNode
}

export function AppLayout({ sx, children, ...other }: AppLayoutProps) {
  const theme = useTheme()

  // const isNavVertical = isNavMini || settings.navLayout === 'vertical';

  return (
    <>
      <GlobalStyles
        styles={{
          body: {}
        }}
      />
      <MainAppBar />
      
      <Box
          component="main"
          sx={{
            position: "absolute",
            display: "flex",
            // ...dimensionConstraints("100%", "100%"),
            top: theme.dimen.appBarHeight,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "transparent",
            ...widthConstraint("100vw"),
            ...OverflowHidden,
            ...sx
          }}
      >
        <Box sx={{
          ...FillWidth,
          ...FlexColumn}}>
          {children}
        </Box>
      </Box>

    </>
  )
}
