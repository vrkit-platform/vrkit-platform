import clsx from "clsx"
import { DashboardConfig, UIImageResource } from "vrkit-models"
import { useService } from "../../service-container"
import { DashboardManagerClient } from "../../../services/dashboard-manager-client"
import { useAsyncCallback } from "../../../hooks"
// import { useModelEditorContext } from "../../model-editor-context"
import { PageMetadata, PageMetadataProps } from "../../page-metadata"
import { AppButtonGroupFormikPositiveNegative } from "../../app-button-group-positive-negative"
import { assignDeep, isEmpty } from "vrkit-shared"
import { FormContainer } from "../../form"
import { AppTextFieldFormik } from "../../app-text-field"
import {
  Ellipsis, flexAlign, FlexRow, FlexRowBox, FlexRowCenterBox, FlexScaleZero
} from "vrkit-shared-ui"
import { DashboardLayoutSwitch } from "../common/layout-switch"
import { classNames } from "./DashboardEditorView"
import { FormikBag, FormikConfig, FormikContextType, FormikProps, withFormik } from "formik"
import { get } from "lodash/fp"
import useTheme from "@mui/material/styles/useTheme"
import { useNavigate } from "react-router-dom"
import { useMemo } from "react"
import { getLogger } from "@3fv/logger-proxy"
import Box from "@mui/material/Box"
import Typography from "@mui/material/Typography"
import CloseIcon from "@mui/icons-material/Close"
import SaveIcon from "@mui/icons-material/Save"
import { createAppContentBarLabels } from "../../app-content-bar"
import { AppIconEditor } from "../../app-icon-editor"
import { ImageFormat } from "vrkit-models"
import Divider from "@mui/material/Divider"
import List from "@mui/material/List"
import ListItem from "@mui/material/ListItem"

const log = getLogger(__filename)

export type DashboardEditorFormProps = {
  dashConfig: DashboardConfig
  handleSubmitRef?: React.MutableRefObject<any>
  onSubmit?: FormikConfig<DashboardConfig>["onSubmit"]
  onBlurField?: (
    event: React.FocusEvent<any>,
    values: Partial<DashboardConfig>,
    formikContext: FormikContextType<DashboardConfig>
  ) => Promise<any> | any
}
export const DashboardEditorForm = withFormik<DashboardEditorFormProps, DashboardConfig>({
  mapPropsToValues: get("dashConfig"),
  validate: () => ({}), // createValidator(DashboardConfig as any),
  enableReinitialize: true,
  displayName: "DashboardEditorFormik",
  handleSubmit: (values: DashboardConfig, formikBag: FormikBag<DashboardEditorFormProps, DashboardConfig>) =>
    formikBag.props.onSubmit?.(values, formikBag)
})(function DashboardListEditorForm(props: DashboardEditorFormProps & FormikProps<DashboardConfig>) {
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
        setValues,
      resetForm,
      submitForm,
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
    }, [launchLayoutEditorAsync.loading, patchConfigAsync.loading]), // {
    //   updateMutatingModel,
    //   clearMutatingModels,
    //   resetMutatingModels,
    //   isMutatingModelNew,
    //   mutatingModels
    // } = useModelEditorContext<DashboardConfig>(),
    // model = first(mutatingModels),
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
    },
    [negLabel, posLabel] =
        createAppContentBarLabels([
            [isEmpty(dashConfig?.id) ? "Cancel" : "Revert", <CloseIcon/>],
          [isEmpty(dashConfig?.id) ? "Create" : "Save", <SaveIcon/>]
        ]),
    pageMetadata: PageMetadataProps = {
      appContentBar: {
        title: `${dashConfig?.name}`,
        actions: (
          <AppButtonGroupFormikPositiveNegative<DashboardConfig>
            item={dashConfig}
            buttonProps={{
              size: "small",
              sx: {gap: theme.spacing(1)}
            }}
            negativeLabel={negLabel}
            negativeHandler={() => {
              resetForm()
              nav(-1)
            }}
            positiveLabel={posLabel}
            positiveHandler={() => {
              handleSubmit()
            }}
            isSubmitting={isSubmitting}
            submitForm={submitForm}
            resetForm={resetForm}
          />
        )
      }
    }

  // UPDATE THE PROVIDED REF ENABLING OTHER
  // UI COMPONENTS/DIALOGS, ETC TO SUBMIT
  if (handleSubmitRef) {
    handleSubmitRef.current = handleSubmit
  }

  return !dashConfig || !values ? undefined : (
    <>
      <PageMetadata {...pageMetadata} />
      <FormContainer
        noValidate
        // onBlur={handleBlur}
        onSubmit={handleSubmit}
      >
        <Box className={clsx(classNames.content)}>
          {/* HEADER */}

          <Box className={clsx(classNames.header)}>
            <Box
                sx={{...FlexRow,
                ...flexAlign("center", "stretch")
                }}
                className={clsx(classNames.headerField)}>
              <AppIconEditor
                icon={dashConfig?.uiResource?.icon?.url}
                onChange={dataUrl => {
                  setValues((model) => assignDeep(model,{
                    uiResource: {
                      icon: {
                        format: ImageFormat.UNKNOWN,
                        isDataUrl: true,
                        url: dataUrl,
                        description: "icon"
                      }
                    }
                  }), false)
                }}
              />
              <AppTextFieldFormik<DashboardConfig>
                variant="standard"
                // onBlur={handleBlurField}
                autoFocus
                // selectOnFocus
                label={null}
                name="name"
                placeholder="A name for your dashboard"
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
                
                // selectOnFocus
                // onBlur={handleBlurField}
                multiline={true}
                label={"Notes"}
                name="description"
                placeholder="Notes about your overlay"
              />
            </Box>
          </Box>
          <Box className={clsx(classNames.details)}>
            <Box className={clsx(classNames.detailsContent)}>
              <Box className={clsx(classNames.layouts)}>
                <FlexRowBox>
                  <Typography
                    sx={{
                      ...Ellipsis,
                      ...FlexScaleZero
                    }}
                    variant="h6"
                  >
                    Layouts
                  </Typography>
                  
                  <DashboardLayoutSwitch
                      vr
                      value={values.vrEnabled}
                      onChange={vrEnabled => {
                        setValues(model => assignDeep(model, {vrEnabled}))
                      }}
                  />
                  <DashboardLayoutSwitch
                      vr={false}
                      value={values.screenEnabled}
                      onChange={screenEnabled => {
                        setValues(model => assignDeep(model, {screenEnabled}))
                      }}
                  />
                </FlexRowBox>
                
              </Box>
              <Divider />
              <Box className={clsx(classNames.overlays)}>
                <Typography
                    sx={{
                      ...Ellipsis
                    }}
                    variant="h6"
                >
                  Overlays
                </Typography>
                <FlexRowBox>
                  <List>
                    {values.overlays.map(o =>
                    (<ListItem key={o.id}>
                      {o.name} - {o.componentId}
                      
                    </ListItem>))}
                  </List>
                </FlexRowBox>
              </Box>
            </Box>
          </Box>
        </Box>
      </FormContainer>
    </>
  )
})
