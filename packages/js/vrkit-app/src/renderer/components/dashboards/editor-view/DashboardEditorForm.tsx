import clsx from "clsx"
import {
  DashboardConfig,
  ImageFormat,
  OverlayInfo, OverlayKind,
  PluginComponentDefinition,
  PluginManifest
} from "@vrkit-platform/models"
import { useService } from "../../service-container"
import { DashboardManagerClient } from "../../../services/dashboard-manager-client"
import { useAsyncCallback } from "../../../hooks" // import {
import { PageMetadata, PageMetadataProps } from "../../page-metadata"
import { AppButtonGroupFormikPositiveNegative } from "../../app-button-group-positive-negative"
import {
  assignDeep, generateUUID,
  isEmpty,
  isEqual,
  propEqualTo
} from "@vrkit-platform/shared"
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
  FlexDefaults,
  FlexProperties,
  FlexRow,
  FlexRowBox, FlexRowCenterBox,
  FlexScaleZero,
  hasCls,
  OverflowHidden,
  padding
} from "@vrkit-platform/shared-ui"
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
import AddIcon from "@mui/icons-material/Add"
import { createAppContentBarLabels } from "../../app-content-bar"
import { AppIconEditor } from "../../app-icon-editor"
import Divider from "@mui/material/Divider"
import { useAppSelector } from "../../../services/store"
import {
  PluginCompEntry,
  sharedAppSelectors
} from "../../../services/store/slices/shared-app"
import ComponentInstanceListItem from "./ComponentInstanceListItem"
import { isDefined } from "@3fv/guard"
import { styled } from "@mui/material/styles"
import Alerts from "../../../services/alerts"
import AppComponentPickerDialog from "../../app-component-picker-dialog"
import Button from "@mui/material/Button"
import { pick } from "lodash"

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
          [child(classNames.detailsContent)]: {
            ...padding(theme.spacing(1)),
            ...FlexColumn,
            ...OverflowHidden,
            ...FlexScaleZero,
            gap: theme.spacing(1),
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
                ...flexAlign("stretch", "flex-start"),
                overflowY: "auto",
                gap: theme.spacing(1),
                [child(classNames.overlayContentList)]: {
                  transition: theme.transitions.create([...FlexProperties]),
                  overflowX: "hidden",
                  overflowY: "auto",
                  ...flex(0, 0, "100%"),

                  [child(classNames.overlayContentListItem)]: {
                    [hasCls(classNames.overlayContentListItemSelected)]: {}
                  },
                  [hasCls(classNames.overlayContentListItemSelected)]: {}
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
  // @ts-ignore
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
    isTouched = !isEqual(values, config),
    onOverlayInfoDelete = useCallback(
      (id: string) => {
        setValues(currentValue => {
          const overlays = (currentValue?.overlays ?? []) as OverlayInfo[],
            idx = overlays.findIndex(o => o.id === id)
          if (idx < 0) {
            Alerts.error(`Overlay with id (${id}) could not be found`)
          } else {
            log.info(`Removing overlay`, id)
            overlays.splice(idx, 1)
          }

          return currentValue
        })
      },
      [setValues, values]
    ),
    onOverlayInfoChange = useCallback(
      (id: string, patch: Partial<OverlayInfo>) => {
        setValues(currentValue => {
          const overlays = currentValue?.overlays ?? [],
            idx = overlays?.findIndex?.(propEqualTo("id", id))

          if (idx < 0) {
            Alerts.error(`Overlay with id (${id}) could not be found`)
          } else {
            const overlay = overlays[idx]
            log.info(`Patching overlay`, overlay, "patch", patch)
            assignDeep(overlay, patch)
          }

          return currentValue
        })
      },
      [setValues, values]
    ),
    dashboardClient = useService(DashboardManagerClient),
    patchConfigAsync = useAsyncCallback(dashboardClient.updateDashboardConfig),
    launchLayoutEditorAsync = useAsyncCallback(dashboardClient.launchLayoutEditor),
    [selectedOverlayId, setSelectedOverlayId] = useState<string>(config?.overlays?.[0]?.id ?? null),
    compEntryMap = useAppSelector(sharedAppSelectors.selectPluginComponentOverlayDefsMap),
    [compPickerOpen, setCompPickerOpen] = useState(false),
      onCompPickerSelect = (compEntries: PluginCompEntry[]) => {
      
      setValues(currentValue => {
          if (!currentValue.overlays) {
            currentValue.overlays = []
          }
          for (const [manifest, comp] of compEntries) {
            const oi = OverlayInfo.create({
              id: generateUUID(),
              componentId: comp.id,
              kind: OverlayKind.PLUGIN,
              name: `${currentValue.overlays.length + 1} - ${comp.name}`,
              ...pick(comp, ["dataVarNames","description"]),
              userSettingValues: {},
            })
            log.info(`Adding overlay component`, oi)
            currentValue.overlays.push(oi)
          }
          return currentValue
        })
        
        setCompPickerOpen(false)
      },
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
            disabled={!isTouched}
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
              <FlexRowBox
                sx={{
                  ...FlexAuto,
                  ...flexAlign("flex-start", "stretch")
                }}
              >
              
              
              <Typography
                sx={{
                  ...Ellipsis,
                  ...FlexScaleZero
                }}
                variant="h6"
              >
                Overlays
              </Typography>
                <FlexRowCenterBox
                  sx={{...FlexAuto}}
                >
                  <Button
                      color="primary"
                      variant="outlined"
                      size="small"
                      onClick={() => {
                        setCompPickerOpen(true)
                      }}
                  >
                    <AddIcon/> Overlay
                  </Button>
                </FlexRowCenterBox>
              </FlexRowBox>
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
                          onDelete={onOverlayInfoDelete}
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
              </Box>
            </Box>
          </Box>
        </Box>
      </FormContainer>
      <AppComponentPickerDialog
          open={compPickerOpen}
          onSelect={onCompPickerSelect}
          onClose={(ev, reason) => {
            log.info(`onClose invoked reason=${reason}`)
            setCompPickerOpen(false)
          }}
      />
    </DashboardEditorFormRoot>
  )
})
