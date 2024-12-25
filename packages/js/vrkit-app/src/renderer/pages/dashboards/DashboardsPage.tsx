import { AppContent } from "../../components/app"
import React from "react"
import { DashboardsListView } from "../../components/dashboards/list-view"
import clsx from "clsx"
import { getLogger } from "@3fv/logger-proxy"
import AppPageContainer, { AppPageContainerProps } from "../../components/app-page-container"

const log = getLogger(__filename)
const { info, debug, warn, error } = log

export interface DashboardsPageProps extends AppPageContainerProps {}

export function DashboardsPage({ className, ...other }: DashboardsPageProps) {
  return (
    <AppContent>
      <AppPageContainer
        className={clsx(className)}
        {...other}
      >
        <DashboardsListView />
      </AppPageContainer>
    </AppContent>
  )
}

export default DashboardsPage
