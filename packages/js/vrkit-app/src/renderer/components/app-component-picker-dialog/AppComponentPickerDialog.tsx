// REACT
import React from "react"

// CLSX
import clsx from "clsx"

// 3FV
import { getLogger } from "@3fv/logger-proxy"

import type { BoxProps } from "@mui/material/Box"
// MUI
import Box from "@mui/material/Box"
import { styled, useTheme } from "@mui/material/styles"

// APP
import {
  alpha,
  child,
  ClassNamesKey,
  createClassNames, CursorPointer,
  Fill,
  FillBounds,
  FillHeight,
  flexAlign,
  FlexAuto,
  FlexColumn,
  FlexDefaults,
  FlexRow,
  FlexRowCenter,
  FlexScale,
  FlexScaleZero,
  hasCls,
  heightConstraint,
  OverflowHidden,
  OverflowVisible,
  padding,
  PositionAbsolute,
  PositionRelative,
  Transparent,
  widthConstraint
} from "vrkit-shared-ui"
import { PluginComponentDefinition } from "vrkit-models"
import { AppDialog, AppDialogProps } from "../app-dialog"
import { useAppSelector } from "../../services/store"
import {
  PluginCompEntry,
  sharedAppSelectors
} from "../../services/store/slices/shared-app"
import {
  PluginComponentItem, pluginComponentItemClasses
} from "../plugin-component-item"

const log = getLogger(__filename)
const { info, debug, warn, error } = log

const classPrefix = "appComponentPickerDialog"
export const appComponentPickerDialogClasses = createClassNames(classPrefix, "root", "header", "content", "contentItem")
const classes = appComponentPickerDialogClasses

export type AppComponentPickerDialogClassKey = ClassNamesKey<typeof appComponentPickerDialogClasses>


const AppComponentPickerDialogRoot = styled(Box, {
  name: "AppComponentPickerDialogRoot",
  label: "AppComponentPickerDialogRoot"
})(({theme}) => ({
  // root styles here
  [hasCls(appComponentPickerDialogClasses.root)]: {
    ...FlexColumn,
    ...FlexDefaults.stretch,
    ...OverflowHidden,
    ...Fill,
    backgroundColor: theme.palette.background.pane01,
    [child(appComponentPickerDialogClasses.header)]: {
      ...FlexAuto,
      ...FlexRowCenter,
      ...OverflowHidden,
    },
    [child(appComponentPickerDialogClasses.content)]: {
      ...FlexScaleZero,
      ...FlexRow,
      ...padding(0, theme.spacing(2)),
      
      overflowY: "hidden",
      overflowX: "auto",
      maxHeight: "100%",
      height: "auto",
      gap: theme.spacing(2),
      
      [child(appComponentPickerDialogClasses.contentItem)]: {
        ...OverflowHidden,
        
        // ...FlexRow,
        ...widthConstraint(`calc(300px + ${theme.spacing(1)})`),
        ...padding(theme.spacing(1)),
        [child(pluginComponentItemClasses.root)]: {
          ...OverflowVisible,
          ...widthConstraint("300px"),
        }
      }  
    }
  }
}))


/**
 * AppComponentPickerDialog Component Properties
 */
export interface AppComponentPickerDialogProps extends Omit<BoxProps, "onSelect" | "component" | "children"> {
  open:boolean
  onClose?: AppDialogProps["onClose"]
  onSelect: (compEntries: PluginCompEntry[]) => any
  multiple?: boolean
  dialogProps?: Partial<Omit<AppDialogProps,"onClose">>
}


/**
 * AppComponentPickerDialog Component
 *
 * @param { AppComponentPickerDialogProps } props
 */
export function AppComponentPickerDialog(props:AppComponentPickerDialogProps) {
  const { className, open, onSelect, onClose, multiple = false, dialogProps:inDialogProps = {}, ...other } = props,
      theme = useTheme(),
      allCompEntryMap = useAppSelector(sharedAppSelectors.selectAllPluginComponentOverlayDefsMap),
      allCompEntries = Object.values(allCompEntryMap)
      

  return <AppDialog
      open={open}
      onClose={onClose}
      {...inDialogProps}
  >
    <AppComponentPickerDialogRoot
    className={clsx(appComponentPickerDialogClasses.root, {}, className)}
    {...other}
  >
    <Box className={clsx(appComponentPickerDialogClasses.header, {})}>
      header
    </Box>
      <Box className={clsx(appComponentPickerDialogClasses.content, {})}>
        {allCompEntries.map((entry) => {
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
                  borderRadius: theme.shape.borderRadius,
                },
                "&::after":{
                  ...PositionAbsolute,
                  ...FillBounds,
                  ...Fill,
                  zIndex: 10,
                  pointerEvents: "none",
                  transition: theme.transitions.create(["background-color"]),
                  content: "' '",
                  backgroundColor: Transparent,
                  borderRadius: theme.shape.borderRadius
                },
                "&:hover": {
                  "&::after": {
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
  </AppComponentPickerDialogRoot>
  </AppDialog>
}

export default AppComponentPickerDialog
