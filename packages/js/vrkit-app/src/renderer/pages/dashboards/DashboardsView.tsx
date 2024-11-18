import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import { styled, useTheme } from "@mui/material/styles"
import Grid from "@mui/material/Unstable_Grid2"
import { AppContent } from "vrkit-app-renderer/layouts/app"
import React, { useState } from "react"
import { DashboardsListView } from "../../components/dashboards/list-view"
import {
  child,
  ClassNamesKey,
  createClassNames,
  FillHeight,
  flexAlign,
  FlexAuto,
  FlexRow,
  FlexScaleZero,
  hasCls
} from "vrkit-shared-ui"
import clsx from "clsx"
import { DashboardsListEditor } from "../../components/dashboards/list-editor"
import { getLogger } from "@3fv/logger-proxy"
import { useAppSelector } from "../../services/store"
import { sharedAppSelectors } from "../../services/store/slices/shared-app"
import {
  useModelEditorContextProvider
} from "../../components/model-editor-context"
import { DashboardConfig } from "vrkit-models"

const log = getLogger(__filename)
const { info, debug, warn, error } = log

const classPrefix = "dashboardsView"
export const dashboardsViewClasses = createClassNames(classPrefix, "root", "list", "editor")
export type DashboardsViewClassKey = ClassNamesKey<typeof dashboardsViewClasses>

const DashboardsViewRoot = styled(Box, {
  name: "DashboardsViewRoot",
  label: "DashboardsViewRoot"
})(({ theme }) => ({
  [hasCls(dashboardsViewClasses.root)]: {
    ...FlexRow,
    ...FillHeight,
    ...flexAlign("stretch", "stretch"),
    [child(dashboardsViewClasses.list)]: {
      ...FillHeight
    },
    [child(dashboardsViewClasses.editor)]: {
      ...FillHeight
    }
  }
}))

export function DashboardsView() {
  const theme = useTheme(),
      configs = useAppSelector(sharedAppSelectors.selectDashboardConfigs),
      editorContext = useModelEditorContextProvider<DashboardConfig>(configs),
      { Provider: ModelEditorProvider, modelById, mutatingModels, setMutatingModel, isModelMutating } = editorContext
      
      

  return (
    <AppContent>
      <ModelEditorProvider value={editorContext}>
      
          <DashboardsViewRoot className={clsx(dashboardsViewClasses.root)}>
            <DashboardsListView className={clsx(dashboardsViewClasses.list)} />
            <DashboardsListEditor className={clsx(dashboardsViewClasses.editor)} />
          </DashboardsViewRoot>
      
      </ModelEditorProvider>
    </AppContent>
  )
}
