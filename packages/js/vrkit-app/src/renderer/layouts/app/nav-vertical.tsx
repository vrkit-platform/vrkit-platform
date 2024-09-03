import type { Breakpoint } from "@mui/material/styles"
import { useTheme } from "@mui/material/styles"
import type { NavSectionProps } from "vrkit-app-renderer/components/nav-section"
import { NavSection } from "vrkit-app-renderer/components/nav-section"

import Box from "@mui/material/Box"

import { varAlpha } from "vrkit-app-renderer/theme/styles"

import { Logo } from "vrkit-app-renderer/components/logo"
import { Scrollbar } from "vrkit-app-renderer/components/scrollbar"

import { NavToggleButton } from "../components/nav-toggle-button"
import React from "react"
import { FlexAuto, FlexScaleZero } from "../../styles/ThemedStyles"

// ----------------------------------------------------------------------

export interface NavVerticalProps extends NavSectionProps {
  layoutQuery: Breakpoint
  onToggleNav: () => void
  slots?: {
    topArea?: React.ReactNode
    bottomArea?: React.ReactNode
  }
}

export function NavVertical({
  sx,
  data,
  slots,
  layoutQuery,
  onToggleNav,
  ...other
}: NavVerticalProps) {
  const theme = useTheme()

  return (
    <Box
      sx={{
        top: 0,
        left: 0,
        height: 1,
        display: "none",
        // position: "fixed",
        flexDirection: "column",
        bgcolor: "var(--layout-nav-bg)",
        zIndex: "var(--layout-nav-zIndex)",
        width: "var(--layout-nav-vertical-width)",
        borderRight: `1px solid var(--layout-nav-border-color, ${varAlpha(
          theme.vars.palette.grey["500Channel"],
          0.12
        )})`,
        transition: theme.transitions.create(["width"], {
          easing: "var(--layout-transition-easing)",
          duration: "var(--layout-transition-duration)"
        }),
        [theme.breakpoints.up(layoutQuery)]: {
          display: "flex"
        },
        [`& .logo-container`]: {
          maxHeight: "6rem",
          position: "relative",
          display: "flex",
          flexDirection: "row",
          maxWidth: "100%",
          [`& > a`]: {
            ...FlexScaleZero,
          },
          ...FlexAuto
        },
        ...sx
      }}
    >
      <NavToggleButton
        onClick={onToggleNav}
        sx={{
          display: "none",
          [theme.breakpoints.up(layoutQuery)]: {
            display: "inline-flex"
          }
        }}
      />

      {slots?.topArea ?? (
        <Box
          className={"logo-container"}
          sx={{ pl: 3.5, pt: 2.5, pb: 1 }}
        >
          <Logo />
        </Box>
      )}

      <Scrollbar fillContent>
        <NavSection
          data={data}
          sx={{ px: 2, flex: "1 1 auto" }}
          {...other}
        />
      </Scrollbar>
    </Box>
  )
}
