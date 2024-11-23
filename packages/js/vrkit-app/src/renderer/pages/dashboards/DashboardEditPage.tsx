import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import { styled, useTheme } from "@mui/material/styles"
import Grid from "@mui/material/Unstable_Grid2"
import { AppContent } from "vrkit-app-renderer/layouts/app"
import React, { useEffect, useState } from "react"
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
import { DashboardsListEditor } from "../../components/dashboards/list-editor"
import { getLogger } from "@3fv/logger-proxy"
import { useAppSelector } from "../../services/store"
import { sharedAppSelectors } from "../../services/store/slices/shared-app"
import {
  useModelEditorContextProvider
} from "../../components/model-editor-context"
import { DashboardConfig } from "vrkit-models"
import { useParams } from "react-router"
import { isNotEmpty } from "vrkit-shared"
import { asOption } from "@3fv/prelude-ts"
import { useNavigate } from "react-router-dom"
import { WebPaths } from "../../routes/WebPaths"
import { DashboardEditor } from "../../components/dashboards/editor"


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
      editorContext = useModelEditorContextProvider<DashboardConfig>(configs),
      {id} = useParams<{
        id: string
      }>(),
      { Provider: ModelEditorProvider, clearMutatingModels, modelById, mutatingModels, setMutatingModel, isModelMutating } = editorContext,
      nav = useNavigate()
  
  
  
  useEffect(() => {
    asOption(id)
      .filter(isNotEmpty)
      
      .match({
        None: () => {
          clearMutatingModels()
          nav(WebPaths.app.dashboards)
        },
        Some: id => setMutatingModel(id === "0" ? DashboardConfig.create({}) : modelById(id))
      })
  }, [id])
  
  return (
      <AppContent>
        <ModelEditorProvider value={editorContext}>
          <DashboardEditPageRoot className={clsx(dashboardEditPageClasses.root)}>
            <DashboardEditor className={clsx(dashboardEditPageClasses.editor)} />
          </DashboardEditPageRoot>
        
        </ModelEditorProvider>
      </AppContent>
  )
}


export default DashboardEditPage
