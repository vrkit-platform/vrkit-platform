import { Page, PageProps } from "../../components/page"
import React, { useState } from "react"
import { getLogger } from "@3fv/logger-proxy"
import { styled } from "@mui/material/styles"
import clsx from "clsx"
import {
  child, createClassNames,
  FlexColumn,
  FlexDefaults,
  FlexScaleZero,
  OverflowHidden,
  PositionRelative
} from "@vrkit-platform/shared-ui"
import Box, { BoxProps } from "@mui/material/Box"

const log = getLogger(__filename)
const { info, debug, warn, error } = log

const classPrefix = "dashboardVRLayoutPage"
const classes = createClassNames(classPrefix, "surface", "overlay")
export const dashboardVRLayoutPageClasses = classes

const DashboardVRLayoutPageRoot = styled("div", {
  name: "DashboardVRLayoutPageRoot"
})(({ theme }) => ({
  ...PositionRelative,
  ...FlexScaleZero,
  ...FlexColumn,
  ...OverflowHidden,
  ...FlexDefaults.stretch,
  [child(classes.surface)]: {
    ...FlexScaleZero,
    ...OverflowHidden,
    ...PositionRelative,
    ...FlexColumn,
    ...FlexDefaults.stretch
  }
}))

export interface DashboardVRLayoutPageProps extends PageProps {}

export function DashboardVRLayoutPage({ className, ...other }: DashboardVRLayoutPageProps) {
  
  return (
      <Page metadata={{
      
      }}>
        <DashboardVRLayoutPageRoot>
          <Box className={clsx(classes.surface)}>
          
          </Box>
        </DashboardVRLayoutPageRoot>
      </Page>
  )
}

export default DashboardVRLayoutPage
