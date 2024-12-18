import clsx from "clsx"
import { DashboardConfig, ImageFormat, OverlayInfo } from "vrkit-models"
import { useService } from "../../service-container"
import { DashboardManagerClient } from "../../../services/dashboard-manager-client"
import { useAsyncCallback } from "../../../hooks" // import {
// useModelEditorContext }
// from
// "../../model-editor-context"
import { PageMetadata, PageMetadataProps } from "../../page-metadata"
import { AppButtonGroupFormikPositiveNegative } from "../../app-button-group-positive-negative"
import { assignDeep, isEmpty, propEqualTo } from "vrkit-shared"
import { FormContainer } from "../../form"
import { AppTextFieldFormik } from "../../app-text-field"
import {
  child,
  ClassNamesKey,
  createClassNames,
  Ellipsis,
  flex,
  flexAlign,
  FlexAuto,
  FlexColumn,
  FlexProperties,
  FlexRow,
  FlexScaleZero,
  hasCls,
  OverflowHidden,
  padding
} from "vrkit-shared-ui"
import { DashboardLayoutSwitch } from "../common/layout-switch"
import { FormikBag, FormikConfig, FormikContextType, FormikProps, withFormik } from "formik"
import { get } from "lodash/fp"
import useTheme from "@mui/material/styles/useTheme"
import { useNavigate } from "react-router-dom"
import { useCallback, useMemo, useState } from "react"
import { getLogger } from "@3fv/logger-proxy"
import Box from "@mui/material/Box"
import Typography from "@mui/material/Typography"
import CloseIcon from "@mui/icons-material/Close"
import SaveIcon from "@mui/icons-material/Save"
import { createAppContentBarLabels } from "../../app-content-bar"
import { AppIconEditor } from "../../app-icon-editor"
import Divider from "@mui/material/Divider"
import { useAppSelector } from "../../../services/store"
import { sharedAppSelectors } from "../../../services/store/slices/shared-app"
import ComponentInstanceListItem from "./ComponentInstanceListItem"
import { isDefined } from "@3fv/guard"
import { styled } from "@mui/material/styles"
import ComponentInstanceForm from "./ComponentInstanceForm"
import Alerts from "../../../services/alerts"

const log = getLogger(__filename)

const classPrefix = "dashboardEditorForm"
const classNames = createClassNames(
  classPrefix,
  "root",
  "visible",
  "form",
  "formBody",
  "header",
  "headerActions",
  "headerField",

  "details",
  "detailsContent",
  "layouts",
  "layout",
  "overlays",
  "overlayContent",
  "overlayContentList",
  "overlayContentListItem",
  "overlayContentListItemSelected",
  "overlayContentListItemForms",
  "overlayContentListItemForm"
)

export const dashboardEditorFormClasses = classNames
export type DashboardEditorClassKey = ClassNamesKey<typeof classNames>

const DashboardEditorFormRoot = styled(Box, {
  name: "DashboardEditorFormRoot",
  label: "DashboardEditorFormRoot"
})(({ theme }) => ({
  // root styles here
  [hasCls(classNames.root)]: {
    ...FlexColumn,
    ...FlexScaleZero,
    ...OverflowHidden,
    [child(classNames.form)]: {
      ...FlexColumn,
      ...FlexScaleZero,
      ...OverflowHidden,
      [child(classNames.formBody)]: {
        ...FlexColumn,
        ...FlexScaleZero,
        ...OverflowHidden,
        [child(classNames.header)]: {
          ...padding(theme.spacing(1)),
          ...FlexColumn,
          ...FlexAuto,
          ...flexAlign("stretch", "center"),
          filter: `drop-shadow(0 0 0.75rem ${theme.palette.background.session})`,

          [child(classNames.headerField)]: {
            ...padding(theme.spacing(1), theme.spacing(2), theme.spacing(0)),
            ...FlexAuto
          },
          [child(classNames.headerActions)]: {}
        },
        [child(classNames.details)]: {
          ...FlexColumn,
          ...OverflowHidden,
          ...FlexScaleZero,

          // ...flexAlign("center", "stretch"),

          // background: darken(theme.palette.background.appBar, 0.2),
          [child(classNames.detailsContent)]: {
            ...padding(theme.spacing(1)),
            ...FlexColumn,
            ...OverflowHidden,
            ...FlexScaleZero,

            gap: theme.spacing(1), // [child(classNames.layouts)]: {
            //   ...padding(0, theme.spacing(1), theme.spacing(2)),
            //   ...FlexColumn,
            //   ...FlexAuto,
            //   gap: theme.spacing(1),
            //   [child(classNames.layout)]: {
            //     gap: theme.spacing(1),
            //     ...FlexRowCenter,
            //     ...flexAlign("stretch", "center"),
            //     ...FlexAuto,
            //
            //     [child("checkbox")]: {
            //       ...FlexAuto
            //     }
            //   }
            // },
            [child(classNames.overlays)]: {
              ...padding(theme.spacing(1), theme.spacing(1), theme.spacing(2)),
              ...FlexColumn,
              ...FlexScaleZero,
              ...OverflowHidden,

              gap: theme.spacing(1),
              [child(classNames.overlayContent)]: {
                ...FlexScaleZero,
                ...FlexColumn,
                ...OverflowHidden,
                ...flexAlign("stretch", "stretch"), // minHeight: 300,
                gap: theme.spacing(1),
                maxHeight: "auto",
                [child(classNames.overlayContentList)]: {
                  transition: theme.transitions.create([...FlexProperties]),
                  overflowX: "hidden",
                  overflowY: "auto",
                  ...flex(1, 1, "100%"),

                  [child(classNames.overlayContentListItem)]: {
                    //border: `1px solid transparent`,
                    [hasCls(classNames.overlayContentListItemSelected)]: {
                      //border: `1px solid
                      // ${theme.palette.border.selected}`,
                    }
                  },
                  [hasCls(classNames.overlayContentListItemSelected)]: {
                    // ...flex(1, 1, "50%")
                  }
                },
                [child(classNames.overlayContentListItemForms)]: {
                  ...flex(0, 0, 0),
                  ...FlexColumn,
                  ...flexAlign("stretch", "stretch"),
                  ...OverflowHidden,
                  transition: theme.transitions.create([...FlexProperties]),
                  [hasCls(classNames.overlayContentListItemSelected)]: {
                    ...flex(1, 1, "50%"),
                    overflowX: "hidden",
                    overflowY: "auto"
                  },
                  [child(classNames.overlayContentListItemForm)]: {
                    ...FlexAuto
                  }
                }
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
export interface DashboardEditorProps {
  config: DashboardConfig

  className?: string
}

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
      setTouched,
      values,
      setValues,
      resetForm,
      submitForm,
      config,

      handleSubmitRef
    } = props,
    theme = useTheme(),
    nav = useNavigate(),
    onOverlayInfoChange = useCallback(
      (id: string, patch: Partial<OverlayInfo>) => {
        setValues(currentValue => {
          const overlay = currentValue?.overlays?.find?.(propEqualTo("id", id))
          if (!overlay) {
            Alerts.error(`Overlay with id (${id}) could not be found`)
          } else {
            log.info(`Patching overlay`, overlay, "patch", patch)
            assignDeep(overlay, patch)
          }

          return currentValue
        })
        
        setTouched({
          ...touched,
          
        })
      },
      [setValues, values, setTouched]
    ),
    dashboardClient = useService(DashboardManagerClient),
    patchConfigAsync = useAsyncCallback(dashboardClient.updateDashboardConfig),
    launchLayoutEditorAsync = useAsyncCallback(dashboardClient.launchLayoutEditor),
    [selectedOverlayId, setSelectedOverlayId] = useState<string>(config?.overlays?.[0]?.id ?? null),
    compEntryMap = useAppSelector(sharedAppSelectors.selectAllPluginComponentOverlayDefsMap),
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
              //nav(-1)
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
    <DashboardEditorFormRoot className={clsx(classNames.root)}>
      <PageMetadata {...pageMetadata} />
      <FormContainer
        noValidate
        // onBlur={handleBlur}
        className={clsx(classNames.form)}
        onSubmit={handleSubmit}
        bodyProps={{
          className: classNames.formBody
        }}
      >
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
              rows={3}
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
              <Box className={clsx(classNames.overlayContent)}>
                <Box
                  className={clsx(classNames.overlayContentList, {
                    [classNames.overlayContentListItemSelected]: !!selectedOverlayId
                  })}
                >
                  {values.overlays
                    .map((o, idx) => {
                      const classList = clsx(classNames.overlayContentListItem, {
                          first: idx === 0,
                          last: idx >= values.overlays.length - 1,
                          [classNames.overlayContentListItemSelected]: o.id === selectedOverlayId
                        }),
                        entry = compEntryMap[o.componentId]
                      return !entry ? null : (
                        <ComponentInstanceListItem
                          key={o.id}
                          selected={selectedOverlayId === o.id}
                          overlayInfo={o}
                          compEntry={entry}
                          className={classList}
                          onChange={onOverlayInfoChange}
                          onClick={ev => {
                            setSelectedOverlayId(o.id)
                            ev.preventDefault()
                          }}
                          sx={{
                            zIndex: values.overlays.length - idx + 1
                          }}
                        />
                      )
                    })
                    .filter(isDefined)}
                </Box>
                {/*<Box*/}
                {/*  className={clsx(classNames.overlayContentListItemForms, {*/}
                {/*    [classNames.overlayContentListItemSelected]: !!selectedOverlayId*/}
                {/*  })}*/}
                {/*>*/}
                {/*  {selectedOverlayId &&*/}
                {/*    values.overlays*/}
                {/*      .map((o, idx) => {*/}
                {/*        const classList = clsx(classNames.overlayContentListItemForm, {*/}
                {/*            [classNames.overlayContentListItemSelected]: o.id === selectedOverlayId*/}
                {/*          }),*/}
                {/*          entry = compEntryMap[o.componentId]*/}
                {/*        return !entry ? null : (*/}
                {/*          <ComponentInstanceForm*/}
                {/*            key={o.id}*/}
                {/*            selected={selectedOverlayId === o.id}*/}
                {/*            overlayInfo={o}*/}
                {/*            compEntry={entry}*/}
                {/*            className={classList}*/}
                {/*            onChange={onOverlayInfoChange}*/}
                {/*          />*/}
                {/*        )*/}
                {/*      })*/}
                {/*      .filter(isDefined)}*/}
                {/*</Box>*/}
              </Box>
            </Box>
          </Box>
        </Box>
      </FormContainer>
    </DashboardEditorFormRoot>
  )
})
