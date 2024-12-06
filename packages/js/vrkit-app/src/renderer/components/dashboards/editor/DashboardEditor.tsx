// REACT
import React, { useEffect, useMemo } from "react"

// CLSX
import clsx from "clsx"

// 3FV
import { getLogger } from "@3fv/logger-proxy"

import type { BoxProps } from "@mui/material/Box"
// MUI
import Box from "@mui/material/Box"
import { darken, styled, useTheme } from "@mui/material/styles"

// APP
import {
  child,
  ClassNamesKey,
  createClassNames,
  Ellipsis,
  FillHeight, FillWidth,
  flexAlign,
  FlexAuto,
  FlexColumn,
  FlexRowBox,
  FlexRowCenter,
  FlexRowCenterBox,
  FlexScaleZero,
  hasCls,
  OverflowAuto,
  OverflowHidden,
  padding
} from "vrkit-shared-ui"
import { attributesEqual, isEmpty, isEqual } from "vrkit-shared"
import IconButton from "@mui/material/IconButton"
import Icon from "../../app-icon"
import Typography from "@mui/material/Typography"
import { isDefined } from "@3fv/guard"
import { DashboardConfig } from "vrkit-models"
import { useService } from "../../service-container"
import { useAsyncCallback } from "../../../hooks"
import Checkbox from "@mui/material/Checkbox"
import { DashboardManagerClient } from "../../../services/dashboard-manager-client"
import { useModelEditorContext } from "../../model-editor-context"
import { type FormikBag, type FormikConfig, FormikContextType, FormikProps, withFormik } from "formik"
import { get } from "lodash/fp"
import { first } from "lodash"
import { bind, cloneInstanceOf } from "vrkit-shared/utils"
import { FormActionFooterDefault, FormContainer } from "../../form"
import { Alert } from "../../../services/alerts"
import { useIsMounted } from "usehooks-ts"
import { FlexRow } from "vrkit-shared-ui/styles"
import { AppTextFieldFormik } from "../../app-text-field"
import { useNavigate } from "react-router-dom"
import { WebPaths } from "../../../routes/WebPaths"
import { faTimes } from "@awesome.me/kit-79150a3eed/icons/duotone/solid"
import { DashboardLayoutSwitch } from "../common/layout-switch"
import { faArrowLeft } from "@awesome.me/kit-79150a3eed/icons/sharp/solid"
import AppBreadcrumbs from "../../app-breadcrumbs"
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
  "widgets",
  "widget"
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
    ...padding(0),//theme.spacing(0.5), theme.spacing(1)),
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
          ...FillWidth,
          
          ...FlexRow,
          ...FlexAuto,
          ...padding(theme.spacing(0.5),theme.spacing(2)),
          ...flexAlign("space-between", "space-between"),
          borderBottom: `1px solid ${darken(theme.palette.background.actionFooter,0.25)}`,
          backgroundColor: theme.palette.background.actionFooter,
          backgroundImage: theme.palette.background.actionFooterImage,
          filter: "drop-shadow(0px 2px 2px rgba(0,0,0, 0.25))",
        }
      },
      [child(classNames.details)]: {
        ...FlexColumn,
        ...OverflowAuto,
        ...FlexAuto,

        // ...flexAlign("center", "stretch"),

        // background: darken(theme.palette.background.appBar, 0.2),
        [child(classNames.detailsContent)]: {
          ...padding(theme.spacing(1)), // ...FillWidth,
          ...FlexColumn,
          ...FlexAuto, // ...OverflowVisible,
          gap: theme.spacing(1),
          [child(classNames.layouts)]: {
            // ...FillWidth,
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
          }
        }
      }
    }
  }
}))

/**
 * DashboardEditor Component Properties
 */
export interface DashboardEditorProps extends BoxProps {}


type DashboardListEditorFormProps = {
  dashConfig: DashboardConfig
  handleSubmitRef?: React.MutableRefObject<any>
  onSubmit?: FormikConfig<DashboardConfig>["onSubmit"]
  onBlurField?: (
    event: React.FocusEvent<any>,
    values: Partial<DashboardConfig>,
    formikContext: FormikContextType<DashboardConfig>
  ) => Promise<any> | any
}

const DashboardEditorForm = withFormik<DashboardListEditorFormProps, DashboardConfig>({
  mapPropsToValues: get("dashConfig"),
  validate: () => ({}), // createValidator(DashboardConfig as any),
  enableReinitialize: true,
  displayName: "DashboardListEditorFormik",
  handleSubmit: (values: DashboardConfig, formikBag: FormikBag<DashboardListEditorFormProps, DashboardConfig>) =>
    formikBag.props.onSubmit?.(values, formikBag)
})(function DashboardListEditorForm(props: DashboardListEditorFormProps & FormikProps<DashboardConfig>) {
  const {
      errors,
      onBlurField,
      handleBlur,

      handleChange,
      handleSubmit,
      isSubmitting,
      initialValues,
      status = {},
      touched,
      values,
      setFieldValue,
      resetForm,
      dashConfig,
      handleSubmitRef
    } = props,
    theme = useTheme(),
    nav = useNavigate(),
    dashboardClient = useService(DashboardManagerClient),
    patchConfigAsync = useAsyncCallback(dashboardClient.updateDashboardConfig),
    launchLayoutEditorAsync = useAsyncCallback(dashboardClient.launchLayoutEditor),
    canModify = useMemo(() => {
      return !launchLayoutEditorAsync.loading && !patchConfigAsync.loading
    }, [launchLayoutEditorAsync.loading, patchConfigAsync.loading]),
    { updateMutatingModel, clearMutatingModels, resetMutatingModels, isMutatingModelNew, mutatingModels } =
      useModelEditorContext<DashboardConfig>(),
    model = first(mutatingModels),
    handleBlurField = (e: React.FocusEvent<any>) => {
      log.info(`On blur <${e.target?.tagName} name=${e.target?.name}>`, e)
      if (onBlurField) {
        onBlurField(e, values, props)
        if (e.isDefaultPrevented() || e.isPropagationStopped()) {
          log.info(
            `e.isDefaultPrevented()=${e.isDefaultPrevented()} || e.isPropagationStopped()=${e.isPropagationStopped()}`
          )
          return
        }
      }
    }

  // UPDATE THE PROVIDED REF ENABLING OTHER
  // UI COMPONENTS/DIALOGS, ETC TO SUBMIT
  if (handleSubmitRef) {
    handleSubmitRef.current = handleSubmit
  }

  return (
    <FormContainer
      noValidate
      // onBlur={handleBlur}
      onSubmit={handleSubmit}
    >
      <Box className={clsx(classNames.content)}>
        {!!model && values && (
          <>
            {/* HEADER */}

            <Box className={clsx(classNames.header)}>
              <Box className={clsx(classNames.headerActions)}>
                
                  <AppBreadcrumbs/>
                  <FormActionFooterDefault<DashboardConfig>
                      item={model}
                      negativeLabel={isEmpty(model.id) ? "Cancel" : "Revert"}
                      negativeHandler={() => {
                        resetMutatingModels([model.id])
                        resetForm()
                        nav(-1)
                      }}
                      positiveLabel={isEmpty(model.id) ? "Create" : "Save"}
                      positiveHandler={() => {
                        handleSubmit()
                      }}
                  />
                
              </Box>
              <Box className={clsx(classNames.headerField)}>
                <AppTextFieldFormik<DashboardConfig>
                  variant="standard"
                  onBlur={handleBlurField}
                  autoFocus
                  // selectOnFocus
                  label={null}
                  name="name"
                  placeholder="My Dash"
                  InputProps={{
                    sx: {
                      "& input": {
                        fontSize: theme.typography.h3.fontSize
                      }
                    }
                  }}
                />
              </Box>

              <Box className={clsx(classNames.headerField)}>
                <AppTextFieldFormik<DashboardConfig>
                  variant="filled"
                  flex
                  rows={4}
                  autoFocus
                  // selectOnFocus
                  onBlur={handleBlurField}
                  multiline={true}
                  label={"Notes"}
                  name="description"
                  placeholder="I made it"
                />
              </Box>
            </Box>
            <Box className={clsx(classNames.details)}>
              <Box className={clsx(classNames.detailsContent)}>
                <Box className={clsx(classNames.layouts)}>
                  <FlexRowCenterBox>
                    <Typography
                      sx={{
                        ...Ellipsis,
                        ...FlexScaleZero
                      }}
                      variant="h6"
                    >
                      Layouts
                    </Typography>
                  </FlexRowCenterBox>
                  <DashboardLayoutSwitch
                    vr
                    value={dashConfig.vrEnabled}
                    label="VR"
                    onChange={vrEnabled => {
                      canModify && patchConfigAsync.execute(dashConfig.id, { vrEnabled })
                    }}
                  />
                  <DashboardLayoutSwitch
                    vr={false}
                    value={dashConfig.screenEnabled}
                    label="Screen"
                    onChange={screenEnabled => {
                      canModify && patchConfigAsync.execute(dashConfig.id, { screenEnabled })
                    }}
                  />
                </Box>
              </Box>
            </Box>
          </>
        )}
      </Box>
      <FormActionFooterDefault<DashboardConfig>
        item={dashConfig}
        negativeLabel="Cancel"
        negativeHandler={e => {
          e.preventDefault()
          // resetForm()
          nav(-1)
        }}
        positiveLabel="Save"
      ></FormActionFooterDefault>
    </FormContainer>
  )
})

/**
 * DashboardEditor Component
 *
 * @param { DashboardEditorProps } props
 */
export function DashboardEditor(props: DashboardEditorProps) {
  const theme = useTheme(),
    isMounted = useIsMounted(),
    nav = useNavigate(),
    { className, ...other } = props,
    dashboardClient = useService(DashboardManagerClient),
    patchConfigAsync = useAsyncCallback(dashboardClient.updateDashboardConfig),
    editorContext = useModelEditorContext<DashboardConfig>(),
    { modelById, mutatingModels, setMutatingModel, isModelMutating, resetMutatingModels, clearMutatingModels } =
      editorContext,
    dashConfig = mutatingModels?.[0],
    onReset = useMemo(() => bind(resetMutatingModels, null, [dashConfig?.id]), [dashConfig?.id]),
    
    onSubmit = Alert.usePromise(
      async (values: DashboardConfig, { setErrors, setStatus, setSubmitting }: FormikContextType<DashboardConfig>) => {
        try {
          // DISPATCH THE SAVE ACTION
          const savedDashConfig = await dashboardClient.updateDashboardConfig(dashConfig?.id, values)
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
      [isMounted, onReset]
    )

  return (
    <DashboardEditorRoot
      className={clsx(
        classNames.root,
        {
          [classNames.visible]: isDefined(dashConfig)
        },
        className
      )}
      {...other}
    >
      <DashboardEditorForm
        dashConfig={dashConfig}
        onSubmit={onSubmit}
        //onBlurField={onBlurField}
      />
    </DashboardEditorRoot>
  )
}

export default DashboardEditor
