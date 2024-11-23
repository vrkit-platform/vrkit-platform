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
  FillHeight,
  flexAlign,
  FlexAuto,
  FlexColumn,
  FlexRowCenter,
  FlexRowCenterBox,
  FlexScaleZero,
  hasCls,
  OverflowAuto,
  OverflowHidden,
  padding
} from "vrkit-shared-ui"
import { attributesEqual, isEqual } from "vrkit-shared"
import IconButton from "@mui/material/IconButton"
import Icon from "../../icon"
import Typography from "@mui/material/Typography"
import { isDefined } from "@3fv/guard"
import { DashboardConfig } from "vrkit-models"
import { useService } from "../../service-container"
import { useAsyncCallback } from "../../../hooks"
import { DashboardManagerClient } from "../../../services/dashboard-manager-client"
import { useModelEditorContext } from "../../model-editor-context"
import { type FormikBag, type FormikConfig, FormikContextType, FormikProps, withFormik } from "formik"
import { get } from "lodash/fp"
import { first } from "lodash"
import { bind, cloneInstanceOf } from "vrkit-shared/utils"
import { FormContainer } from "../../form"
import { Alert } from "../../../services/alerts"
import { useIsMounted } from "usehooks-ts"
import { FlexRow } from "vrkit-shared-ui/styles"
import { AppTextFieldFormik } from "../../app-text-field"
import { DashboardLayoutSwitch } from "../common/layout-switch"
import { useNavigate } from "react-router-dom"
import { faTimes } from "@awesome.me/kit-79150a3eed/icons/duotone/solid"
import { WebPaths } from "../../../routes/WebPaths"

const log = getLogger(__filename)
const { info, debug, warn, error } = log

const classPrefix = "dashboardsListEditor"
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
export type DashboardsListEditorClassKey = ClassNamesKey<typeof classNames>

const DashboardsListEditorRoot = styled(Box, {
  name: "DashboardsListEditorRoot",
  label: "DashboardsListEditorRoot"
})(({ theme }) => ({
  // root styles here
  [hasCls(classNames.root)]: {
    // ...transition(["flex-grow", "flex-shrink", "flex-basis",
    // "filter"]),
    ...FlexColumn,
    ...FillHeight,
    ...OverflowHidden,
    ...FlexScaleZero,
    ...padding(theme.spacing(0.5), theme.spacing(1)),
    background: darken(theme.palette.background.appBar, 0.4),

    [child(classNames.content)]: {
      ...FlexColumn,

      [child(classNames.header)]: {
        ...padding(theme.spacing(1)),
        ...FlexColumn,
        ...FlexAuto,
        ...flexAlign("stretch", "center"),
        filter: `drop-shadow(0 0 0.75rem ${theme.palette.background.session})`,

        [child(classNames.headerField)]: {
          // ...FlexScaleZero,
          ...FlexAuto
        },
        [child(classNames.headerActions)]: {
          ...flexAlign("center", "flex-start"),
          ...FlexRow,
          ...FlexAuto,
          background: darken(theme.palette.background.root, 0.2)
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
 * DashboardsListEditor Component Properties
 */
export interface DashboardsListEditorProps extends BoxProps {}

type DashboardListEditorFormProps = {
  dashConfig: DashboardConfig
  handleSubmitRef?: React.MutableRefObject<any>
  onSubmit: FormikConfig<DashboardConfig>["onSubmit"]
  //onSubmit: (id: string, patch:Partial<DashboardConfig>) =>
  // Promise<DashboardConfig>
}

const DashboardListEditorForm = withFormik<DashboardListEditorFormProps, DashboardConfig>({
  mapPropsToValues: get("dashConfig"),
  validate: () => ({}), // createValidator(DashboardConfig as any),
  enableReinitialize: true,
  displayName: "DashboardListEditorFormik",
  handleSubmit: (values: DashboardConfig, formikBag: FormikBag<DashboardListEditorFormProps, DashboardConfig>) =>
    formikBag.props.onSubmit(values, formikBag)
})(function DashboardListEditorForm(props: DashboardListEditorFormProps & FormikProps<DashboardConfig>) {
  const {
      errors,
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
    model = first(mutatingModels)

  useEffect(() => {
    if (!model) {
      return
    }

    const updatedModel = cloneInstanceOf(DashboardConfig, model, values)
    if (
      !isEqual(updatedModel, model) &&
      !attributesEqual(updatedModel, model, DashboardConfig)
      // isModelSameOrUpdated(updatedModel, model)
    ) {
      updateMutatingModel(updatedModel)
    }
  }, [model, values])

  // UPDATE THE PROVIDED REF ENABLING OTHER
  // UI COMPONENTS/DIALOGS, ETC TO SUBMIT
  if (handleSubmitRef) {
    handleSubmitRef.current = handleSubmit
  }

  return (
    <FormContainer
      noValidate
      onSubmit={handleSubmit}
    >
      <Box className={clsx(classNames.content)}>
        {!!model && values && (
          <>
            {/* HEADER */}

            <Box className={clsx(classNames.header)}>
              <Box className={clsx(classNames.headerActions)}>
                <IconButton
                  aria-label="cancel"
                  color="inherit"
                  onClick={() => {
                    nav(WebPaths.app.dashboards)
                  }}
                >
                  <Icon
                    fa
                    icon={faTimes}
                  />
                </IconButton>
              </Box>

              <Box className={clsx(classNames.headerField)}>
                <AppTextFieldFormik<DashboardConfig>
                  variant="standard"
                  autoFocus
                  selectOnFocus
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
                    {/*<Button*/}
                    {/*  sx={{*/}
                    {/*    ...FlexAuto*/}
                    {/*  }}*/}
                    {/*  variant="contained"*/}
                    {/*  disabled={!canModify || (!dashConfig?.vrEnabled && !dashConfig?.screenEnabled)}*/}
                    {/*  onClick={() => {*/}
                    {/*    canModify && launchLayoutEditorAsync.execute(dashConfig.id)*/}
                    {/*  }}*/}
                    {/*>*/}
                    {/*  Edit Layouts*/}
                    {/*</Button>*/}
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
    </FormContainer>
  )
})

/**
 * DashboardsListEditor Component
 *
 * @param { DashboardsListEditorProps } props
 */
export function DashboardsListEditor(props: DashboardsListEditorProps) {
  const theme = useTheme(),
    isMounted = useIsMounted(),
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
        // DERIVE VALID PROJECT OBJECT
        // const pendingDash = DashboardConfig.create(values)
        try {
          // DISPATCH THE SAVE ACTION
          const savedDashConfig = await patchConfigAsync.execute(dashConfig?.id, values)

          if (isMounted()) {
            setStatus({ success: true })
            setSubmitting(false)
          }

          onReset()
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
    <DashboardsListEditorRoot
      className={clsx(
        classNames.root,
        {
          [classNames.visible]: isDefined(dashConfig)
        },
        className
      )}
      {...other}
    >
      <DashboardListEditorForm
        dashConfig={dashConfig}
        onSubmit={onSubmit}
      />
    </DashboardsListEditorRoot>
  )
}

export default DashboardsListEditor
