import { DefaultConfig } from 'vrkit-app-renderer/config-global';
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
  hasCls, PositionRelative
} from "vrkit-shared-ui"
import clsx from "clsx"
import { getLogger } from "@3fv/logger-proxy"
import { useAppSelector } from "../../services/store"
import { sharedAppSelectors } from "../../services/store/slices/shared-app"
import {
  useModelEditorContextProvider
} from "../../components/model-editor-context"
import { DashboardConfig } from "vrkit-models"

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
    ...FlexRow,
    ...FillHeight,
    ...flexAlign("stretch", "stretch"),
    ...PositionRelative,
    [child(dashboardsPageClasses.list)]: {
      ...FillHeight
    },
    [child(dashboardsPageClasses.editor)]: {
      ...FillHeight
    }
  }
}))

export function DashboardsPage() {
  const theme = useTheme(),
      configs = useAppSelector(sharedAppSelectors.selectDashboardConfigs),
      editorContext = useModelEditorContextProvider<DashboardConfig>(configs),
      { Provider: ModelEditorProvider, modelById, mutatingModels, setMutatingModel, isModelMutating } = editorContext
  
  
  
  return (
      <AppContent>
        <ModelEditorProvider value={editorContext}>
          
          <DashboardsPageRoot className={clsx(dashboardsPageClasses.root)}>
            <DashboardsListView className={clsx(dashboardsPageClasses.list)} />
            {/*<DashboardsListEditor className={clsx(dashboardsPageClasses.editor)} />*/}
          </DashboardsPageRoot>
        
        </ModelEditorProvider>
      </AppContent>
  )
}


export default DashboardsPage
