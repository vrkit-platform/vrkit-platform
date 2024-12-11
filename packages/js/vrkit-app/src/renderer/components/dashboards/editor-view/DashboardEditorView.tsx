// REACT
import React, { useMemo } from "react"

// CLSX
import clsx from "clsx"

// 3FV
import { getLogger } from "@3fv/logger-proxy"

import type { BoxProps } from "@mui/material/Box"
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
  FlexColumn,
  FlexRowCenter,
  FlexScaleZero,
  hasCls,
  OverflowAuto,
  OverflowHidden,
  padding
} from "vrkit-shared-ui"
import { isDefined } from "@3fv/guard"
import { DashboardConfig } from "vrkit-models"
import { useService } from "../../service-container"
import { DashboardManagerClient } from "../../../services/dashboard-manager-client"
import { FormikContextType } from "formik"
import { bind } from "vrkit-shared/utils"
import { Alert } from "../../../services/alerts"
import { useIsMounted } from "usehooks-ts"
import { useNavigate } from "react-router-dom"
import { DashboardEditorForm } from "./DashboardEditorForm"
// import { faWindowClose } from "@awesome.me/kit-79150a3eed"

const log = getLogger(__filename)
const { info, debug, warn, error } = log

const classPrefix = "dashboardEditor"
export const classNames = createClassNames(
  classPrefix,
  "root",
  "visible",
  "content",
  "header",
  "headerActions",
  "headerField",

  "details",
  "detailsContent",
  "layouts",
  "layout",
  "overlays",
  "overlay"
)
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
    background: darken(theme.palette.background.appBar, 0.4),

    [child(classNames.content)]: {
      ...FlexColumn,
      ...FlexScaleZero,
      ...OverflowAuto,
      [child(classNames.header)]: {
        ...padding(0),
        ...FlexColumn,
        ...FlexAuto,
        ...flexAlign("stretch", "center"),
        filter: `drop-shadow(0 0 0.75rem ${theme.palette.background.session})`,

        [child(classNames.headerField)]: {
          ...padding(theme.spacing(1)),
          ...FlexAuto
        },
        [child(classNames.headerActions)]: {
        
        }
      },
      [child(classNames.details)]: {
        ...FlexColumn,
        ...OverflowAuto,
        ...FlexAuto,

        // ...flexAlign("center", "stretch"),

        // background: darken(theme.palette.background.appBar, 0.2),
        [child(classNames.detailsContent)]: {
          ...padding(theme.spacing(1)),
          ...FlexColumn,
          ...FlexAuto, // ...OverflowVisible,
          gap: theme.spacing(1),
          [child(classNames.layouts)]: {
            ...padding(0,theme.spacing(1),theme.spacing(2)),
            ...FlexColumn,
            ...FlexAuto,
            gap: theme.spacing(1),
            [child(classNames.layout)]: {
              gap: theme.spacing(1),
              ...FlexRowCenter,
              ...flexAlign("stretch", "center"),
              ...FlexAuto,

              [child("checkbox")]: {
                ...FlexAuto
              }
            }
          },
          [child(classNames.overlays)]: {
            ...padding(theme.spacing(1),theme.spacing(1),theme.spacing(2)),
            ...FlexColumn,
            ...FlexAuto,
            gap: theme.spacing(1),
            [child(classNames.overlay)]: {
            
            }
          }
        }
      }
    }
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
    // editorContext = useModelEditorContext<DashboardConfig>(),
    // { modelById, mutatingModels, setMutatingModel, isModelMutating, resetMutatingModels, clearMutatingModels } =
    //   editorContext,
    //config = mutatingModels?.[0],
    //onReset = useMemo(() => bind(resetMutatingModels, null, [config?.id]), [config?.id]),
    onSubmit = Alert.usePromise(
      async (values: DashboardConfig, { setErrors, setStatus, setSubmitting }: FormikContextType<DashboardConfig>) => {
        try {
          // DISPATCH THE SAVE ACTION
          const savedDashConfig = await dashboardClient.updateDashboardConfig(config?.id, values)
          if (isMounted()) {
            setStatus({ success: true })
            setSubmitting(false)
          }

          nav(-1)
          return savedDashConfig
        } catch (err) {
          error(err)
          if (isMounted()) {
            setStatus({ success: false, errorMessage: err.message })
            setSubmitting(false)
          }

          return err
        }
      },
      {
        loading: "Saving dashboard...",
        success: ({ result }) => `"Successfully saved dashboard (${result.name})."`,
        error: "Unable to save project."
      },
      [isMounted]
    )

  return (
    <DashboardEditorRoot
      className={clsx(
        classNames.root,
        {
          [classNames.visible]: isDefined(config)
        },
        className
      )}
      {...other}
    >
      <DashboardEditorForm
        dashConfig={config}
        onSubmit={onSubmit}
        //onBlurField={onBlurField}
      />
    </DashboardEditorRoot>
  )
}

export default DashboardEditorView
