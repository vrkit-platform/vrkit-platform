import Box from "@mui/material/Box"
import { styled } from "@mui/material/styles"
import { AppContent } from "../../components/app"
import React from "react"
import { DashboardsListView } from "../../components/dashboards/list-view"
import {
  ClassNamesKey,
  createClassNames,
  flexAlign,
  FlexAuto,
  FlexColumn,
  hasCls,
  OverflowVisible,
  PositionRelative
} from "vrkit-shared-ui"
import clsx from "clsx"
import { getLogger } from "@3fv/logger-proxy"

const log = getLogger(__filename)
const { info, debug, warn, error } = log

const classPrefix = "dashboardsPage"
export const dashboardsPageClasses = createClassNames(classPrefix, "root", "list", "editor")
export type DashboardsPageClassKey = ClassNamesKey<typeof dashboardsPageClasses>

const DashboardsPageRoot = styled(Box, {
  name: "DashboardsPageRoot",
  label: "DashboardsPageRoot"
})(({ theme }) => ({
  [hasCls(dashboardsPageClasses.root)]: {
    ...FlexAuto,
    ...OverflowVisible,
    ...FlexColumn,
    ...flexAlign("stretch", "stretch"),
    ...PositionRelative
  }
}))

export function DashboardsPage() {
  return (
    <AppContent>
      <DashboardsPageRoot className={clsx(dashboardsPageClasses.root)}>
        <DashboardsListView />
      </DashboardsPageRoot>
    </AppContent>
  )
}

export default DashboardsPage
