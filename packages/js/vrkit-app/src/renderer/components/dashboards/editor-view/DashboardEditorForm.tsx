import clsx from "clsx"
import { DashboardConfig, ImageFormat } from "vrkit-models"
import { useService } from "../../service-container"
import { DashboardManagerClient } from "../../../services/dashboard-manager-client"
import { useAsyncCallback } from "../../../hooks"
// import { useModelEditorContext } from "../../model-editor-context"
import { PageMetadata, PageMetadataProps } from "../../page-metadata"
import { AppButtonGroupFormikPositiveNegative } from "../../app-button-group-positive-negative"
import { assignDeep, isEmpty } from "vrkit-shared"
import { FormContainer } from "../../form"
import { AppTextFieldFormik } from "../../app-text-field"
import { Ellipsis, flexAlign, FlexAuto, FlexRow, FlexScaleZero } from "vrkit-shared-ui"
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
import Divider from "@mui/material/Divider"
import { PluginOverlayItem } from "../../plugin-overlay-item"
import { useAppSelector } from "../../../services/store"
import { sharedAppSelectors } from "../../../services/store/slices/shared-app"

const log = getLogger(__filename)

export type DashboardEditorFormProps = {
  config: DashboardConfig
  handleSubmitRef?: React.MutableRefObject<any>
  onSubmit?: FormikConfig<DashboardConfig>["onSubmit"]
  onBlurField?: (
    event: React.FocusEvent<any>,
    values: Partial<DashboardConfig>,
    formikContext: FormikContextType<DashboardConfig>
  ) => Promise<any> | any
}
export const DashboardEditorForm = withFormik<DashboardEditorFormProps, DashboardConfig>({
  mapPropsToValues: get("config"),
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
      config,

      handleSubmitRef
    } = props,
    theme = useTheme(),
    nav = useNavigate(),
    dashboardClient = useService(DashboardManagerClient),
    patchConfigAsync = useAsyncCallback(dashboardClient.updateDashboardConfig),
    launchLayoutEditorAsync = useAsyncCallback(dashboardClient.launchLayoutEditor),
    plugins = useAppSelector(sharedAppSelectors.selectAllPluginManifests),
    canModify = useMemo(() => {
      return !launchLayoutEditorAsync.loading && !patchConfigAsync.loading
    }, [launchLayoutEditorAsync.loading, patchConfigAsync.loading]), // {
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
    [negLabel, posLabel] = createAppContentBarLabels([
      [isEmpty(config?.id) ? "Cancel" : "Revert", <CloseIcon />],
      [isEmpty(config?.id) ? "Create" : "Save", <SaveIcon />]
    ]),
    pageMetadata: PageMetadataProps = {
      appContentBar: {
        title: `${config?.name}`,
        actions: (
          <AppButtonGroupFormikPositiveNegative<DashboardConfig>
            item={config}
            buttonProps={{
              size: "small",
              sx: { gap: theme.spacing(1) }
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

  return !config || !values ? undefined : (
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
              sx={{
                ...FlexRow,
                ...flexAlign("center", "stretch"),

                gap: theme.spacing(1)
              }}
              className={clsx(classNames.headerField)}
            >
              <AppIconEditor
                icon={config?.uiResource?.icon?.url}
                onChange={dataUrl => {
                  setValues(
                    model =>
                      assignDeep(model, {
                        uiResource: {
                          icon: {
                            format: ImageFormat.UNKNOWN,
                            isDataUrl: true,
                            url: dataUrl,
                            description: "icon"
                          }
                        }
                      }),
                    false
                  )
                }}
              />
              <AppTextFieldFormik<DashboardConfig>
                variant="standard"
                onBlur={handleBlurField}
                autoFocus
                //selectOnFocus
                label={null}
                name="name"
                placeholder="A name for your dashboard"
                sx={{
                  ...FlexScaleZero
                }}
                InputProps={{
                  sx: {
                    "& input": {
                      fontSize: theme.typography.h3.fontSize
                    }
                  }
                }}
              />
              <DashboardLayoutSwitch
                vr
                value={values.vrEnabled}
                onChange={vrEnabled => {
                  setValues(model => assignDeep(model, { vrEnabled }))
                }}
              />
              <DashboardLayoutSwitch
                vr={false}
                value={values.screenEnabled}
                onChange={screenEnabled => {
                  setValues(model => assignDeep(model, { screenEnabled }))
                }}
              />
            </Box>

            <Box className={clsx(classNames.headerField)}>
              <AppTextFieldFormik<DashboardConfig>
                variant="filled"
                flex
                rows={4}
                tabIndex={-1}
                multiline={true}
                label={"Notes"}
                name="description"
                placeholder="Notes about your overlay"
              />
            </Box>
          </Box>
          <Box className={clsx(classNames.details)}>
            <Box className={clsx(classNames.detailsContent)}>
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
                <Box
                  sx={{
                    gap: 20,
                    display: "grid",
                    gridTemplateColumns: `1fr 1fr`,
                    ...FlexAuto
                  }}
                >
                  {plugins[0].components.map((comp, idx) => (
                    <PluginOverlayItem
                      key={comp.id}
                      manifest={plugins[0]}
                      componentDef={comp}
                    />
                  ))}
                  {/*<List>*/}
                  {/*  {values.overlays.map(o => (*/}
                  {/*    <ListItem key={o.id}>*/}
                  {/*      {o.name} - {o.componentId}*/}
                  {/*    </ListItem>*/}
                  {/*  ))}*/}
                  {/*</List>*/}
                </Box>
              </Box>
            </Box>
          </Box>
        </Box>
      </FormContainer>
    </>
  )
})
