import { lighten, styled } from "@mui/material/styles"
import * as React from "react"
import { useState } from "react"
import { FormContainer, FormContent, formContentClasses } from "../../../components/form"
import {
  child,
  createClassNames,
  dimensionConstraints,
  Fill,
  FlexAuto,
  FlexColumnCenter,
  FlexDefaults,
  FlexRow,
  FlexRowCenter,
  FlexScaleZero,
  hasCls,
  padding
} from "@vrkit-platform/shared-ui"
import AddIcon from "@mui/icons-material/Add"
import ResetIcon from '@mui/icons-material/RestartAlt';

import { SettingsLabel } from "../components/SettingsLabel"
import { useService } from "../../../components/service-container"
import { useAppSelector } from "../../../services/store"
import { sharedAppSelectors } from "../../../services/store/slices/shared-app"

import { ActionDef, assign, cloneDeep, defaults, isNotEmpty, stopEvent } from "@vrkit-platform/shared"
import { getLogger } from "@3fv/logger-proxy"
import Box from "@mui/material/Box"
import Chip, { chipClasses as muiChipClasses } from "@mui/material/Chip"
import Button from "@mui/material/Button"
import { AcceleratorChipInfo, ShortcutKeyCaptureDialog } from "../components/ShortcutKeyCaptureDialog"
import { Alert } from "../../../services/alerts"
import { WebActionManager } from "../../../services/actions-web"
import { asOption } from "@3fv/prelude-ts"
import { ActionCustomization } from "@vrkit-platform/models"
import { capitalize, uniq } from "lodash"

const log = getLogger(__filename)

export interface ShortcutKeyMappingSettingsPanelProps {}

const ShortcutKeyMappingFormContainer = styled(FormContainer, {
  name: "ShortcutKeyMappingFormContainer"
})(({ theme }) => ({
  ...Fill,
  ...FlexColumnCenter
}))

const classPrefix = "shortcutKeyMappingSettingsPanel"
const classes = createClassNames(
  classPrefix,
  "action",
  "actionLabel",
  "actionValue",
  "actionShortcutAction",
  "actionShortcuts",
  "actionShortcut"
)

const ShortcutKeyMappingFormContent = styled(FormContent, {
  name: "ShortcutKeyMappingFormContent"
})(({ theme }) => ({
  [hasCls(formContentClasses.root)]: {
    [`& > .${formContentClasses.scroller}`]: {
      ...FlexScaleZero,
      ...FlexDefaults.stretch,
      ...FlexDefaults.stretchSelf,
      [`& > .${formContentClasses.content}`]: {
        ...FlexColumnCenter,
        flex: "1 0 auto",
        paddingTop: theme.spacing(2),
        paddingBottom: theme.spacing(2),
        [child(classes.action)]: {
          display: "grid",
          gridTemplateColumns: "40vw 40vw",
          justifyContent: "center",
          alignItems: "center",
          columnGap: "2rem",
          [child(classes.actionLabel)]: {
            fontWeight: 500
          },
          [child(classes.actionValue)]: {
            ...FlexRow,
            ...FlexScaleZero,
            flexWrap: "nowrap",
            backgroundColor: theme.palette.background.paper,
            borderRadius: theme.shape.borderRadius,
            [child(classes.actionShortcuts)]: {
              ...FlexRow,
              ...FlexScaleZero,
              ...padding(theme.spacing(1)),
              flexWrap: "wrap",
              gap: theme.spacing(1),
              [`& .${classes.actionShortcut}.${muiChipClasses.root}`]: {
                backgroundColor: lighten(theme.palette.background.paper, 0.2)
              }
            },
            [child(classes.actionShortcutAction)]: {
              ...FlexAuto,
              ...FlexRowCenter,
              ...padding(0, theme.spacing(0.5)),

              borderLeft: `1px solid ${lighten(theme.palette.background.paper, 0.2)}`,
              borderRadius: 0,
              minHeight: "100%",
              height: "auto",
              "&, & svg": {
                color: lighten(theme.palette.background.paper, 0.2)
              },
              "& svg": {
                ...dimensionConstraints(25)
              }
            }
          }
        }
      }
    }
  }
}))

export function ShortcutKeyMappingSettingsPanel(_props: ShortcutKeyMappingSettingsPanelProps) {
  const appSettings = useAppSelector(sharedAppSelectors.selectAppSettings),
    actionCustomizations = useAppSelector(sharedAppSelectors.selectActionCustomizations),
    allActions = useAppSelector(sharedAppSelectors.selectAllActions),
    webActionManager = useService(WebActionManager),
    [enableCaptureShortcut, setEnableCaptureShortcut] = useState<boolean>(false),
    [selectedAction, setSelectedAction] = useState<ActionDef>(null),
    handleAcceleratorChange = Alert.usePromise(
      async (action: ActionDef, targetAccelerator: string, customAction: "update" | "remove" | "reset" = "update") => {
        log.info(`${customAction} new shortcut(${targetAccelerator}) to (${action.name})`)
        setEnableCaptureShortcut(false)

        const customization = asOption(appSettings?.actionCustomizations ?? {})
          .map(map => map[action.id])
          .map(customization => cloneDeep(customization))
          .orElse(asOption({} as ActionCustomization))
          .map(customization =>
            defaults(customization, {
              id: action.id,
              accelerators: []
            })
          )
          .map(customization =>
            assign(customization, {
              accelerators:
                customAction === "reset"
                  ? []
                  : customAction === "remove"
                    ? customization.accelerators.filter(it => it !== targetAccelerator)
                    : uniq([...customization.accelerators, targetAccelerator])
            })
          )
          .getOrThrow(`Unable to ${customAction} customization`)

        await webActionManager.updateActionCustomization(customization)
      },
      {
        loading: ({ args: [action, shortcut, customAction = "update"] }) => `${capitalize(customAction)} shortcut (${shortcut}) to action (${action.name})`,
        success: ({ args: [action, shortcut, customAction = "update"] }) => `${capitalize(customAction)} shortcut (${shortcut}) to action (${action.name})`,
        error: ({ err, args: [action, shortcut, customAction = "update"] }) =>
          `Unable to ${customAction} shortcut (${shortcut}) to action (${action.name}): ${err.message}\n${err.stack}`
      },
      [selectedAction, appSettings?.actionCustomizations]
    ),
    newShortcutResetHandler = (action: ActionDef) => (e: React.MouseEvent) => {
      stopEvent(e)
      if (handleAcceleratorChange.executing) {
        Alert.warning(`accelerator change in progress`)
        return
      }

      handleAcceleratorChange.execute(action, null, "reset")
    },
    newShortcutShowHandler = (action: ActionDef) => (e: React.MouseEvent) => {
      stopEvent(e)
      setSelectedAction(action)
      setEnableCaptureShortcut(true)
    },
    newDeleteHandler = (action: ActionDef, accelerator: string) => (ev: React.MouseEvent) => {
      stopEvent(ev)
      if (handleAcceleratorChange.executing) {
        Alert.warning(`accelerator change in progress`)
        return
      }

      handleAcceleratorChange.execute(action, accelerator, "remove")
    }

  return (
    <ShortcutKeyMappingFormContainer>
      <ShortcutKeyMappingFormContent
        flexGrow={1}
        contentProps={{
          alignSelf: "center"
        }}
      >
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "auto",
            rowGap: "2rem",
            justifyContent: "center",
            alignItems: "center"
          }}
        >
          {allActions.map(action => {
            const accelerators = asOption(actionCustomizations?.[action.id]?.accelerators)
                .map(accelerators =>
                  accelerators.map(
                    accelerator =>
                      ({
                        isDefault: false,
                        accelerator
                      }) as AcceleratorChipInfo
                  )
                )
                .filter(isNotEmpty)
                .orElse(
                  asOption(
                    action.defaultAccelerators?.map(
                      accelerator =>
                        ({
                          isDefault: true,
                          accelerator
                        }) as AcceleratorChipInfo
                    )
                  )
                )
                .get(),
              isCustom = accelerators.some(it => !it.isDefault)

            return (
              <Box
                key={action.id}
                className={classes.action}
              >
                <SettingsLabel className={classes.actionLabel}>{action.description ?? action.name}</SettingsLabel>
                <Box className={classes.actionValue}>
                  <Box className={classes.actionShortcuts}>
                    {accelerators.map(({ isDefault, accelerator }) => (
                      <Chip
                        key={accelerator}
                        label={accelerator}
                        className={classes.actionShortcut}
                        onDelete={isDefault ? undefined : newDeleteHandler(action, accelerator)}
                      />
                    ))}
                  </Box>
                  <If condition={isCustom}>
                    <Button
                      className={classes.actionShortcutAction}
                      onClick={newShortcutResetHandler(action)}
                    >
                      <ResetIcon />
                    </Button>
                  </If>
                  <Button
                    className={classes.actionShortcutAction}
                    onClick={newShortcutShowHandler(action)}
                  >
                    <AddIcon />
                  </Button>
                </Box>
              </Box>
            )
          })}
        </Box>
        <ShortcutKeyCaptureDialog
          open={enableCaptureShortcut && !!selectedAction}
          action={selectedAction}
          onCancel={() => {
            log.info(`Cancelled add shortcut`)
            setEnableCaptureShortcut(false)
          }}
          onCapture={(action, newShortcut) => {
            log.info(`onCapture accel=${newShortcut} for ${action.name}`)
            setEnableCaptureShortcut(false)
            handleAcceleratorChange.execute(action,newShortcut)
          }}
        />
      </ShortcutKeyMappingFormContent>
    </ShortcutKeyMappingFormContainer>
  )
}
