import GlobalStyles from "@mui/material/GlobalStyles"
import { styled, SxProps, Theme, useTheme } from "@mui/material/styles"

import React, { useState } from "react"

import MainAppBar from "../core/MainAppBar"
import type { BoxProps } from "@mui/material/Box"
import Box from "@mui/material/Box"
import {
  dimensionConstraints,
  Fill,
  FillHeight,
  FillWidth,
  FillWindow, flex,
  flexAlign,
  FlexAuto,
  FlexColumn,
  FlexRow,
  FlexScaleZero,
  OverflowHidden,
  widthConstraint
} from "../../styles"
import Drawer from "@mui/material/Drawer"
import AppDrawerMenu from "vrkit-app-renderer/components/app-drawer-menu"

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
  // color: theme.vars.palette.divider,
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


// ----------------------------------------------------------------------

export type AppLayoutProps = {
  sx?: SxProps
  children: React.ReactNode
}

export function AppLayout({ sx, children, ...other }: AppLayoutProps) {
  const theme = useTheme(),
      [isDrawerOpen, setDrawerOpen] = useState(true),
     toggleDrawer = (newOpen: boolean) => () => {
        setDrawerOpen(newOpen);
      }

  // const isNavVertical = isNavMini || settings.navLayout === 'vertical';

  return (
    <>
      <GlobalStyles
        styles={{
          body: {
            [`& > #root`]: {
              ...FlexColumn,
              ...FillWindow,
              ...OverflowHidden,
            }
          }
        }}
      />
      <MainAppBar />
      
      <Box
          component="main"
          sx={{
            //position: "absolute",
            ...FlexRow,
            ...flexAlign("stretch", "stretch"),
            // top: theme.dimen.appBarHeight,
            // left: 0,
            // right: 0,
            // bottom: 0,
            ...FlexScaleZero,
            backgroundColor: "transparent",
            ...widthConstraint("100vw"),
            ...OverflowHidden,
            ...sx
          }}
      >
        <Drawer
            variant="permanent"
            open={isDrawerOpen}
            onClose={toggleDrawer(false)}
            sx={{
              position: "relative",
              ...flex(0,1,"calc(min(300px,25vw))"),
              ...FlexColumn,
              ...flexAlign("stretch","stretch"),
              [`& .MuiDrawer-paper`]: {
                position: "relative",
              },
            }}
        >
          <AppDrawerMenu/>
        </Drawer>
        <Box sx={{
          ...FlexScaleZero,
          ...OverflowHidden,
          ...FillHeight,
          ...FlexColumn}}>
          {children}
        </Box>
      </Box>

    </>
  )
}
