// REACT
import React, { useEffect, useRef, useState } from "react"

// CLSX
import clsx from "clsx"

// 3FV
import { getLogger } from "@3fv/logger-proxy"

// MUI
import Button from "@mui/material/Button"
import Box from "@mui/material/Box"
import { darken, lighten, styled, useTheme } from "@mui/material/styles"

// APP
import {
  child,
  ClassNamesKey,
  createClassNames,
  FillWidth,
  FlexColumnCenter,
  FlexRowCenter,
  FlexScaleZero,
  hasCls,
  margin,
  padding,
  PositionRelative
} from "@vrkit-platform/shared-ui"
import Dialog, { DialogProps } from "@mui/material/Dialog"
import DialogContent from "@mui/material/DialogContent"
import { ActionDef, ElectronIPCChannel, isEmpty, isNotEmpty, isNotEmptyString } from "@vrkit-platform/shared"
import { SettingsLabel } from "./SettingsLabel"
import Chip, { chipClasses as muiChipClasses } from "@mui/material/Chip"
import { isString } from "@3fv/guard"
import Typography from "@mui/material/Typography"
import DialogActions from "@mui/material/DialogActions"
import { useService } from "../../../components/service-container"
import { WebActionManager } from "../../../services/actions-web"

const log = getLogger(__filename)
const { info, debug, warn, error } = log

const classPrefix = "shortcutKeyCaptureDialog"
const classes = createClassNames(
  classPrefix,
  "root",
  "content",
  "label",
  "shortcut",
  "shortcutKey",
  "shortcutPlaceholder"
)
export const shortcutKeyCaptureDialogClasses = classes

export type ShortcutKeyCaptureDialogClassKey = ClassNamesKey<typeof classes>

const ShortcutKeyCaptureDialogRoot = styled(Dialog, {
  name: "ShortcutKeyCaptureDialogRoot",
  label: "ShortcutKeyCaptureDialogRoot"
})(
  ({
    theme: {
      dimen,
      palette,
      shape,
      customShadows,
      shadows,
      components,
      colors,
      transitions,
      typography,
      insetShadows,
      mixins,
      zIndex,
      spacing
    }
  }) => ({
    // root styles here
    [hasCls(classes.root)]: {}
  })
)

const ContentRoot = styled(DialogContent, {
  name: "ShortcutKeyCaptureContentRoot",
  label: "ShortcutKeyCaptureContentRoot"
})(
  ({
    theme: {
      dimen,
      palette,
      shape,
      customShadows,
      shadows,
      components,
      colors,
      transitions,
      typography,
      insetShadows,
      mixins,
      zIndex,
      spacing
    }
  }) => ({
    // root styles here
    [hasCls(classes.content)]: {
      ...FlexColumnCenter,
      gap: spacing(1), // display: "grid",
      // gridTemplateColumns: "auto",
      // rowGap: spacing(1),
      // justifyContent: "center",
      // alignItems: "center",
      ...padding(spacing(2), spacing(2), spacing(2), spacing(2)),
      minWidth: `50vw`,
      backgroundColor: darken(palette.background.paper, 0.2),
      [child(classes.shortcut)]: {
        backgroundColor: palette.background.paper,
        borderRadius: shape.borderRadius,
        minHeight: 40,
        ...FillWidth,
        ...FlexRowCenter,
        ...PositionRelative,
        ...margin(spacing(2), spacing(1), spacing(1), spacing(1)),
        ...padding(spacing(1)),
        flexWrap: "wrap",

        gap: spacing(1),
        [`& .${classes.shortcutPlaceholder}`]: {
          ...FlexRowCenter,
          ...FlexScaleZero,

          color: lighten(palette.background.paper, 0.2)
        },
        [`& .${muiChipClasses.root}`]: {
          backgroundColor: lighten(palette.background.paper, 0.2)
        }
      }
    }
  })
)

/**
 * ShortcutKeyCaptureDialog Component Properties
 */
export interface ShortcutKeyCaptureDialogProps extends DialogProps {
  action: ActionDef

  onCapture: (actionDef: ActionDef, newShortcut: string) => any

  onCancel: (actionDef: ActionDef) => any
}

export interface AcceleratorChipInfo {
  isDefault: boolean

  accelerator: string
}

/**
 * ShortcutKeyCaptureDialog Component
 *
 * @param { ShortcutKeyCaptureDialogProps } props
 */
export function ShortcutKeyCaptureDialog(props: ShortcutKeyCaptureDialogProps) {
  const theme = useTheme(),
    { className, open, action, onCapture, onCancel, ...other } = props,
    [shortcut, setShortcut] = useState<string>(null),
    shortcutRef = useRef<string>(null),
    webActionManager = useService(WebActionManager),
    handleCapture = () => {
      onCapture(action, shortcut)
    }

  shortcutRef.current = shortcut

  useEffect(() => {
    if (open) {
      const handler = (ev: KeyboardEvent) => {
        const mods = [ev.altKey && "Alt", ev.ctrlKey && "Control", ev.shiftKey && "Shift", ev.metaKey && "Meta"].filter(
            isString
          ),
          code = ev.code
        ev.stopImmediatePropagation()
        ev.stopPropagation()
        ev.preventDefault()

        if (code.toLowerCase() === "enter" && !mods.length) {
          if (isNotEmptyString(shortcutRef.current)) {
            onCapture(action, shortcutRef.current)
          }
          return
        }
        const parts = [...mods, code].filter(isString),
          newShortcut = parts.join("+")
        log.info(`captured shortcut (${newShortcut})`)
        setShortcut(newShortcut)
      }
      window.addEventListener("keydown", handler)
      webActionManager.setCaptureKeyboardEnabled(true).catch(err => {
        log.error(`Unable to enable ${ElectronIPCChannel.setCaptureKeyboardEnabled}`, err)
      })
      return () => {
        webActionManager.setCaptureKeyboardEnabled(false).catch(err => {
          log.error(`Unable to disable ${ElectronIPCChannel.setCaptureKeyboardEnabled}`, err)
        })
        window.removeEventListener("keydown", handler)
      }
    }
  }, [open, action])

  return (
    <ShortcutKeyCaptureDialogRoot
      open={open}
      onClose={() => {
        onCancel(action)
      }}
      className={clsx(classes.root, {}, className)}
      {...other}
    >
      <ContentRoot className={clsx(classes.content)}>
        {open && !!action && (
          <>
            <Typography variant="subtitle1">Add Shortcut</Typography>
            <SettingsLabel className={classes.label}>{action.description ?? action.name}</SettingsLabel>
            <Box
              className={classes.shortcut}
              tabIndex={-1}
              autoFocus
            >
              <Choose>
                <When condition={isNotEmpty(shortcut)}>
                  {shortcut.split("+").map((k, i) => (
                    <Chip
                      key={i}
                      label={k}
                      className={classes.shortcutKey}
                    />
                  ))}
                </When>
                <Otherwise>
                  <Box className={classes.shortcutPlaceholder}>Press the new key combination...</Box>
                </Otherwise>
              </Choose>
            </Box>
          </>
        )}
      </ContentRoot>
      <DialogActions>
        <Button
          variant="outlined"
          size="small"
          onClick={() => {
            onCancel(action)
          }}
        >
          Cancel
        </Button>
        <Button
          disabled={!shortcut || isEmpty(shortcut) || !action}
          color="primary"
          variant="contained"
          size="small"
          onClick={handleCapture}
        >
          Add
        </Button>
      </DialogActions>
    </ShortcutKeyCaptureDialogRoot>
  )
}

export default ShortcutKeyCaptureDialog
