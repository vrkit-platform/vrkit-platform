// REACT
import React from "react"

// CLSX
import clsx from "clsx"

// 3FV
import { getLogger } from "@3fv/logger-proxy"

import type { BoxProps } from "@mui/material/Box"
// MUI
import Box from "@mui/material/Box"
import Dialog, { dialogClasses, DialogProps } from "@mui/material/Dialog"
import { styled } from "@mui/material/styles"

// APP
import {
  alpha, child,
  ClassNamesKey,
  createClassNames,
  Fill,
  FillBounds,
  FillWidth,
  hasCls,
  heightConstraint,
  margin,
  OverflowHidden,
  PositionAbsolute,
  PositionRelative
} from "vrkit-shared-ui"
import AppDialogTransition from "./AppDialogTransition"
import { backdropClasses } from "@mui/material/Backdrop"

const log = getLogger(__filename)
const { info, debug, warn, error } = log

const classPrefix = "appDialog"
export const appDialogClasses = createClassNames(classPrefix, "root", "content")
const classes = appDialogClasses

export type AppDialogClassKey = ClassNamesKey<typeof appDialogClasses>


const AppDialogRoot = styled(Dialog, {
  name: "AppDialogRoot",
  label: "AppDialogRoot"
})(({theme}) => ({
  // root styles here
  [hasCls(appDialogClasses.root)]: {
    // child styled here
    [child(appDialogClasses.content)]: {
    
    }
  }
}))


/**
 * AppDialog Component Properties
 */
export interface AppDialogProps extends Omit<DialogProps, "TransitionComponent" | "keepMounted" | "fullscreenable" | "maxWidth" | "fullWidth"> {

}


/**
 * AppDialog Component
 *
 * @param { AppDialogProps } props
 */
export function AppDialog(props:AppDialogProps) {
  const { className, open,sx, onClose, children, ...other } = props

  return (
    <AppDialogRoot
      className={clsx(appDialogClasses.root, {}, className)}
      open={open}
      TransitionComponent={AppDialogTransition}
      keepMounted
      onClose={onClose}
      fullWidth={true}
      maxWidth={false}
      PaperProps={{
        sx: {
          ...OverflowHidden,
          ...PositionAbsolute,
          ...FillBounds,
          ...margin(0),
          ...Fill,
          // ...heightConstraint("100%")
          //maxHeight: "100%",
          // minHeight: "30vh",
          // height: "auto",
        }
      }}
      sx={{
        ...FillWidth,
        ...OverflowHidden,
        ...margin(0),
        top: "unset",
        bottom: 0,
        maxHeight: "70vh",
        minHeight: "50vh",
        height: "auto",
        [child(dialogClasses.container)]: {
          ...PositionAbsolute,
          ...FillBounds
        },
        [child(backdropClasses.root)]: {
          backgroundColor: alpha("black",0.7)
        },
        ...sx
      }}
      {...other}
    >
      {children}
    </AppDialogRoot>
  )
  
}

export default AppDialog
