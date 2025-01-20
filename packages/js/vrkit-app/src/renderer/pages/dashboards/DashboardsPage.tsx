import { PageContent } from "../../components/page"
import React from "react"
import { DashboardsListView } from "../../components/dashboards/list-view"
import clsx from "clsx"
import { getLogger } from "@3fv/logger-proxy"
import PageContainer, { PageContainerProps } from "../../components/app-page-container"

const log = getLogger(__filename)
const { info, debug, warn, error } = log

export interface DashboardsPageProps extends PageContainerProps {}

export function DashboardsPage({ className, ...other }: DashboardsPageProps) {
  return (
    <PageContent>
      <PageContainer
        className={clsx(className)}
        {...other}
      >
        <DashboardsListView />
      </PageContainer>
    </PageContent>
  )
}

export default DashboardsPage
