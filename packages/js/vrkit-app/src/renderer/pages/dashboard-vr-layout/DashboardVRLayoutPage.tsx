import { Page, PageProps } from "../../components/page"
import React, { useMemo } from "react"
import { getLogger } from "@3fv/logger-proxy"
import { lighten, styled } from "@mui/material/styles"
import {
  alpha,
  child,
  Fill,
  flex,
  flexAlign,
  FlexAuto,
  FlexColumn,
  FlexColumnCenter,
  FlexDefaults,
  FlexRow, FlexRowCenter,
  FlexScaleZero,
  OverflowHidden,
  OverflowVisible,
  padding,
  PositionAbsolute,
  PositionRelative
} from "@vrkit-platform/shared-ui"
import Box from "@mui/material/Box"
import { useResizeObserver } from "../../hooks"
import { isNumber } from "@3fv/guard"
import { RectI } from "@vrkit-platform/models"
import { asOption } from "@3fv/prelude-ts"
import dashboardVRLayoutPageClasses from "./DashboardVRLayoutPageClasses"
import { EditorSurface } from "./EditorSurface"

const log = getLogger(__filename)
const { info, debug, warn, error } = log

const classes = dashboardVRLayoutPageClasses

const DashboardVRLayoutPageRoot = styled(Box, {
  name: "DashboardVRLayoutPageRoot"
})(({ theme }) => ({
  ...PositionRelative,
  ...FlexScaleZero,
  ...OverflowHidden,
  ...FlexColumn,
  ...flexAlign("stretch", "stretch"),
  [child(classes.header)]: {
    ...FlexRowCenter,
    ...FlexAuto,
    ...padding(theme.spacing(2),theme.spacing(4)),
    [child(classes.headerInstructions)]: {
      ...theme.typography.h3,
      fontWeight: 100,
      opacity: 0.5,
      textAlign: "center",
      
    }
  },
  [child(classes.surfaceContainer)]: {
    ...PositionRelative,
    ...FlexColumn,
    ...FlexScaleZero,
    ...flexAlign("stretch", "stretch"),
    ...OverflowHidden,
  [child(classes.surface)]: {
    ...FlexScaleZero,
      ...OverflowHidden,
    ...PositionAbsolute,
    border: `3px solid ${theme.palette.primary.main}`,
    borderRadius: theme.shape.borderRadius,
    backgroundColor: lighten(theme.palette.primary.main, 0.35),
    [child(classes.item)]: {
      ...PositionAbsolute, ...OverflowHidden,
      border: `1px solid ${theme.palette.secondary.main}`,
      backgroundColor: theme.palette.secondary.main,
      borderRadius: theme.shape.borderRadius,
      [child(classes.itemContent)]: {
        ...FlexColumn, ...Fill, ...FlexDefaults.stretchSelf, ...OverflowHidden, ...flexAlign(
            "stretch",
            "flex-start"
        ), [child(classes.itemContentHeader)]: {
          ...OverflowHidden, ...FlexRow, ...flex(0, 1, "auto"), ...flexAlign(
              "center",
              "stretch"
          ), ...padding(theme.spacing(0.25), theme.spacing(0.5)),
          backgroundColor: alpha("#FFF", 0.2),
          gap: theme.spacing(1),
          
        }
      }
    }
  }
  }
}))

export interface DashboardVRLayoutPageProps extends PageProps {}

export function DashboardVRLayoutPage({ className, ...other }: DashboardVRLayoutPageProps) {
  const [contentRef, size] = useResizeObserver(),
    surfaceRect = useMemo<RectI>(
      () =>
        !size
          ? null
          : asOption(Math.min(...Object.values(size).filter(isNumber)))
              .filter(dim => dim >= 100)
              .map(dim => Math.floor(dim * 0.97))
              .map(dim => {
                return RectI.create({
                  size: {
                    width: dim,
                    height: dim
                  },
                  position: {
                    x: (size.width - dim) / 2,
                    y: (size.height - dim) / 2
                  }
                })
              })
              .getOrCall(() => {
                log.warn(`Invalid dimension detected, must be > 100`)
                return null
              }),

      [size]
    )
  log.info("VR Layout Editor Content Size", size)
  return (
    <Page
      metadata={{
        title: "VR Layout Editor"
      }}
    >
      <DashboardVRLayoutPageRoot >
        <Box className={classes.header}>
          <Box className={classes.headerInstructions}>
            Drag and resize the overlays below.  <br/>
            Launch an OpenXR Application to see changes on HMD in real-time.
          </Box>
        </Box>
        <Box className={classes.surfaceContainer} ref={contentRef}>
        
        
        
        <If condition={!!surfaceRect}>
          <EditorSurface rect={surfaceRect} />
        </If>
        </Box>
      </DashboardVRLayoutPageRoot>
    </Page>
  )
}

export default DashboardVRLayoutPage
