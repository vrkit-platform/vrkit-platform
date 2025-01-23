// REACT
import React from "react"

// CLSX
import clsx from "clsx"

// 3FV
import { getLogger } from "@3fv/logger-proxy"

// MUI
import Box from "@mui/material/Box"
import { darken, styled } from "@mui/material/styles"

// APP
import {
  child,
  ClassNamesKey,
  createClassNames,
  FillHeight,
  flexAlign,
  FlexAuto,
  FlexColumn, FlexRow,
  FlexRowCenter,
  FlexScaleZero,
  hasCls,
  OverflowAuto,
  OverflowHidden,
  padding
} from "@vrkit-platform/shared-ui"
import { isDefined } from "@3fv/guard"
import { DashboardConfig } from "@vrkit-platform/models"
import { useService } from "../../service-container"
import { DashboardManagerClient } from "../../../services/dashboard-manager-client"
import { FormikContextType } from "formik"
import { Alert } from "../../../services/alerts"
import { useIsMounted } from "usehooks-ts"
import { useNavigate } from "react-router-dom"
import { DashboardEditorForm } from "./DashboardEditorForm"

const log = getLogger(__filename)
const { info, debug, warn, error } = log

const classPrefix = "dashboardEditor"
const classNames = createClassNames(
  classPrefix,
  "root",
  "visible",
)

export const dashboardEditorViewClasses = classNames
export type DashboardEditorClassKey = ClassNamesKey<typeof classNames>

const DashboardEditorRoot = styled(Box, {
  name: "DashboardEditorRoot",
  label: "DashboardEditorRoot"
})(({ theme }) => ({
  // root styles here
  [hasCls(classNames.root)]: {
    // ...transition(["flex-grow", "flex-shrink", "flex-basis",
    // "filter"]),
    ...FlexColumn,
    ...FillHeight,
    ...OverflowHidden,
    ...FlexScaleZero,
    ...padding(0), //theme.spacing(0.5), theme.spacing(1)),
    background: theme.palette.background.pane01,

  }
}))

/**
 * DashboardEditor Component Properties
 */
export interface DashboardEditorProps  {
  config: DashboardConfig,
  className?: string
}

/**
 * DashboardEditor Component
 *
 * @param { DashboardEditorProps } props
 */
export function DashboardEditorView(props: DashboardEditorProps) {
  const
    isMounted = useIsMounted(),
    nav = useNavigate(),
    { className, config, ...other } = props,
    dashboardClient = useService(DashboardManagerClient),
    onSubmit = Alert.usePromise(
      async (values: DashboardConfig, { setErrors, setTouched, setStatus, setSubmitting, resetForm }: FormikContextType<DashboardConfig>) => {
        try {
          // DISPATCH THE SAVE ACTION
          const savedDashConfig = await dashboardClient.updateDashboardConfig(config?.id, values)
          if (isMounted()) {
            setStatus({ success: true })
          }
          // nav(-1)
          resetForm({
            values: DashboardConfig.clone(savedDashConfig),
            touched: {},
            errors: {}
          })
          return savedDashConfig
        } catch (err) {
          error(err)
          if (isMounted()) {
            setStatus({ success: false, errorMessage: err.message })
            setSubmitting(false)
          }

          return err
        } finally {
          setSubmitting(false)
        }
      },
      {
        loading: "Saving dashboard...",
        success: ({ result }) => `"Successfully saved dashboard (${result.name})."`,
        error: "Unable to save project."
      },
      [isMounted]
    )

  return isDefined(config) && (
    <DashboardEditorRoot
      className={clsx(
        classNames.root,
        className
      )}
      {...other}
    >
      <DashboardEditorForm
        config={config}
        onSubmit={onSubmit.execute}
      />
    </DashboardEditorRoot>
  )
}

export default DashboardEditorView
