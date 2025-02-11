import { Page, PageProps } from "../../components/page"
import React from "react"
import clsx from "clsx"
import { styled } from "@mui/material/styles"
import { getLogger } from "@3fv/logger-proxy"

import {
  child,
  Ellipsis,
  flexAlign,
  FlexAuto,
  FlexColumn,
  FlexRow,
  FlexRowCenter,
  FlexScaleZero,
  OverflowAuto,
  OverflowHidden,
  padding,
  PositionRelative
} from "@vrkit-platform/shared-ui"
import Box from "@mui/material/Box"
import classes from "./DashboardControllerPageClasses"

const log = getLogger(__filename)
const { info, debug, warn, error } = log

const DashboardControllerPageRoot = styled(Box, {
  name: "DashboardControllerPageRoot"
})(({ theme }) => ({
  ...PositionRelative,
  ...FlexScaleZero,
  ...OverflowHidden,
  ...FlexColumn,
  ...flexAlign("stretch", "stretch"),
  [child(classes.header)]: {
    ...FlexRowCenter,
    ...FlexAuto,
    ...padding(theme.spacing(2), theme.spacing(4)),
    [child(classes.headerInstructions)]: {
      ...theme.typography.h3,
      fontWeight: 100,
      opacity: 0.5,
      textAlign: "center"
    }
  },
  [child(classes.overlays)]: {
    ...PositionRelative,
    ...FlexColumn,
    ...FlexScaleZero,
    ...flexAlign("stretch", "stretch"),
    ...OverflowAuto,
    [child(classes.overlayRow)]: {
      ...FlexRow,
      ...OverflowHidden,
      borderRadius: theme.shape.borderRadius,

      [child(classes.overlayDetails)]: {
        ...Ellipsis,
        ...FlexScaleZero,
        ...OverflowHidden,
        [child(classes.overlayActions)]: {
          ...FlexRowCenter,
          ...FlexAuto,
          ...OverflowHidden,
          ...padding(theme.spacing(0.25), theme.spacing(0.5)),
          gap: theme.spacing(1),
          [child(classes.overlayAction)]: {
            ...OverflowHidden,
            ...FlexRowCenter,
            ...FlexAuto
          }
        }
      }
    }
  }
}))

export interface DashboardControllerPageProps extends PageProps {}

export function DashboardControllerPage({ className, ...other }: DashboardControllerPageProps) {
  return (
    <Page
      metadata={{
        title: "Dashboard Controller"
      }}
    >
      <DashboardControllerPageRoot className={clsx(className)}>
        <Box className={classes.header}>
          <Box className={classes.headerInstructions}>
            Drag and resize the overlays below. <br />
            Launch an OpenXR Application to see changes on HMD in real-time.
          </Box>
        </Box>
        <Box className={classes.overlays}></Box>
      </DashboardControllerPageRoot>
    </Page>
  )
}

export default DashboardControllerPage
