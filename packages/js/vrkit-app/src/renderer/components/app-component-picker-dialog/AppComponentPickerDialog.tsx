// REACT
import React from "react"

// CLSX
import clsx from "clsx"

// 3FV
import { getLogger } from "@3fv/logger-proxy"

import type { BoxProps } from "@mui/material/Box"
// MUI
import Box from "@mui/material/Box"
import { useTheme } from "@mui/material/styles"

// APP
import {
  alpha,
  child,
  ClassNamesKey,
  createClassNames,
  CursorPointer,
  Fill,
  FillBounds,
  FillHeight,
  FlexColumn,
  FlexDefaults,
  FlexRow,
  FlexScaleZero,
  hasCls,
  OverflowHidden,
  OverflowVisible,
  padding,
  PositionAbsolute,
  PositionRelative,
  Transparent,
  widthConstraint
} from "@vrkit-platform/shared-ui"
import { AppDialog, AppDialogProps } from "../app-dialog"
import { useAppSelector } from "../../services/store"
import { PluginCompEntry, sharedAppSelectors } from "../../services/store/slices/shared-app"
import { PluginComponentItem, pluginComponentItemClasses } from "../plugin-component-item"
import { Theme } from "../../theme/ThemeTypes"
import GlobalStyles from "@mui/material/GlobalStyles"

const log = getLogger(__filename)
const { info, debug, warn, error } = log

const classPrefix = "appComponentPickerDialog"
export const appComponentPickerDialogClasses = createClassNames(classPrefix, "root", "header", "content", "contentItem")
const classes = appComponentPickerDialogClasses

export type AppComponentPickerDialogClassKey = ClassNamesKey<typeof appComponentPickerDialogClasses>

function appComponentPickerDialogStyles(theme: Theme) {
  return {
    // root styles here
    [`div.${appComponentPickerDialogClasses.root}`]: {
      ...FlexColumn,
      ...FlexDefaults.stretch,
      ...OverflowHidden,
      ...Fill,

      [child(appComponentPickerDialogClasses.content)]: {
        ...FlexScaleZero,
        ...FlexRow,
        ...padding(0, theme.spacing(2)),
        backgroundColor: theme.palette.background.pane01,

        overflowY: "hidden",
        overflowX: "auto",
        maxHeight: "100%",
        height: "100%",
        gap: theme.spacing(2),

        [child(appComponentPickerDialogClasses.contentItem)]: {
          ...OverflowHidden,
          ...widthConstraint(`calc(300px + ${theme.spacing(1)})`),
          ...padding(theme.spacing(1)),
          [child(pluginComponentItemClasses.root)]: {
            ...OverflowVisible,
            ...widthConstraint("300px")
          }
        }
      }
    }
  }
}

/**
 * AppComponentPickerDialog Component Properties
 */
export interface AppComponentPickerDialogProps extends Omit<BoxProps, "onSelect" | "component" | "children"> {
  open: boolean

  onClose?: AppDialogProps["onClose"]

  onSelect: (compEntries: PluginCompEntry[]) => any

  multiple?: boolean

  dialogProps?: Partial<Omit<AppDialogProps, "onClose">>
}

/**
 * AppComponentPickerDialog Component
 *
 * @param { AppComponentPickerDialogProps } props
 */
export function AppComponentPickerDialog(props: AppComponentPickerDialogProps) {
  const { className, open, onSelect, onClose, multiple = false, dialogProps: inDialogProps = {}, ...other } = props,
    theme = useTheme(),
    allCompEntryMap = useAppSelector(sharedAppSelectors.selectPluginComponentOverlayDefsMap),
    allCompEntries = Object.values(allCompEntryMap)

  return (
    <>
      <GlobalStyles styles={appComponentPickerDialogStyles(theme)} />
      <AppDialog
        open={open}
        onClose={onClose}
        title="Select Overlay Component"
        className={clsx(appComponentPickerDialogClasses.root, {}, className)}
        {...inDialogProps}
      >
        {/*<Box className={clsx(appComponentPickerDialogClasses.header, {})}>*/}
        {/*  header*/}
        {/*</Box>*/}
        <Box className={clsx(appComponentPickerDialogClasses.content, {})}>
          {allCompEntries.map(entry => {
            const [manifest, comp] = entry

            return (
              <Box
                key={comp.id}
                className={classes.contentItem}
                sx={{
                  ...PositionRelative
                }}
              >
                <PluginComponentItem
                  sx={{
                    ...FillHeight,
                    ...PositionRelative,
                    ...CursorPointer,
                    [hasCls(pluginComponentItemClasses.root)]: {
                      borderRadius: theme.shape.borderRadius
                    },
                    "&::after": {
                      ...PositionAbsolute,
                      ...FillBounds,
                      ...Fill,
                      zIndex: 10,
                      pointerEvents: "none",
                      transition: theme.transitions.create(["border", "background-color"]),
                      content: "' '",
                      backgroundColor: Transparent,
                      border: `1px solid transparent`,
                      borderRadius: theme.shape.borderRadius
                    },
                    "&:hover": {
                      "&::after": {
                        border: `1px solid ${theme.palette.action.active}`,
                        backgroundColor: alpha(theme.palette.action.active, 0.25)
                      }
                    }
                  }}
                  onClick={(manifest, comp) => {
                    onSelect([[manifest, comp]])
                  }}
                  manifest={manifest}
                  componentDef={comp}
                />
              </Box>
            )
          })}
        </Box>
      </AppDialog>
    </>
  )
}

export default AppComponentPickerDialog
