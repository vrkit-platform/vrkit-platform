import Box from "@mui/material/Box"
import { styled, useTheme } from "@mui/material/styles"
import { AppContent } from "../../components/app"
import React, { useEffect } from "react"
import {
  child,
  ClassNamesKey,
  createClassNames,
  FillHeight,
  flexAlign,
  FlexRow,
  hasCls,
  PositionRelative
} from "@vrkit-platform/shared-ui"
import clsx from "clsx"
import { getLogger } from "@3fv/logger-proxy"
import { useAppSelector } from "../../services/store"
import { sharedAppSelectors } from "../../services/store/slices/shared-app"
import { useParams } from "react-router"
import { propEqualTo } from "@vrkit-platform/shared"
import { useNavigate } from "react-router-dom"
import { WebPaths } from "../../routes/WebPaths"
import { DashboardEditorView } from "../../components/dashboards/editor-view"

const log = getLogger(__filename)
const { info, debug, warn, error } = log

const classPrefix = "dashboardEditPage"
export const dashboardEditPageClasses = createClassNames(classPrefix, "root", "list", "editor")
export type DashboardEditPageClassKey = ClassNamesKey<typeof dashboardEditPageClasses>

const DashboardEditPageRoot = styled(Box, {
  name: "DashboardEditPageRoot",
  label: "DashboardEditPageRoot"
})(({ theme }) => ({
  [hasCls(dashboardEditPageClasses.root)]: {
    ...FlexRow,
    ...FillHeight,
    ...flexAlign("stretch", "stretch"),
    ...PositionRelative,
    [child(dashboardEditPageClasses.list)]: {
      ...FillHeight
    },
    [child(dashboardEditPageClasses.editor)]: {
      ...FillHeight
    }
  }
}))

export function DashboardEditPage() {
  const theme = useTheme(),
    configs = useAppSelector(sharedAppSelectors.selectDashboardConfigs),
    { id } = useParams<{
      id: string
    }>(),
    nav = useNavigate(),
    config = configs.find(propEqualTo("id", id))

  useEffect(() => {
    if (!config) {
      nav(WebPaths.app.dashboards)
    }
  }, [config])

  return (
    <AppContent>
      <DashboardEditPageRoot className={clsx(dashboardEditPageClasses.root)}>
        <DashboardEditorView
          className={clsx(dashboardEditPageClasses.editor)}
          config={config}
        />
      </DashboardEditPageRoot>
    </AppContent>
  )
}

export default DashboardEditPage
