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
  child,
  ClassNamesKey,
  createClassNames,
  FlexAuto,
  FlexRowCenter,
  hasCls, padding
} from "vrkit-shared-ui"
import { FormikContextType, useFormikContext } from "formik"
import Button, { ButtonProps } from "@mui/material/Button"

const log = getLogger(__filename)
const { info, debug, warn, error } = log

const classPrefix = "appButtonGroupPositiveNegative"
export const appButtonGroupPositiveNegativeClasses = createClassNames(classPrefix, "root")
export type AppButtonGroupPositiveNegativeClassKey = ClassNamesKey<typeof appButtonGroupPositiveNegativeClasses>


const AppButtonGroupPositiveNegativeRoot = styled(Box, {
  name: "AppButtonGroupPositiveNegativeRoot",
  label: "AppButtonGroupPositiveNegativeRoot"
})(({theme}) => ({
  // root styles here
  [hasCls(appButtonGroupPositiveNegativeClasses.root)]: {
    ...FlexRowCenter,
    ...FlexAuto,
    ...padding(theme.spacing(0.25),theme.spacing(0.5)),
    
    gap: theme.spacing(2),
  }
}))


/**
 * AppButtonGroupPositiveNegative Component Properties
 */
export interface AppButtonGroupPositiveNegativeProps extends BoxProps {
  buttonProps?: Partial<ButtonProps>
  negativeLabel: string
  negativeHandler: React.MouseEventHandler
  positiveLabel: string
  positiveHandler: React.MouseEventHandler
}


/**
 * AppButtonGroupPositiveNegative Component
 *
 * @param { AppButtonGroupPositiveNegativeProps } props
 */
export function AppButtonGroupPositiveNegative(props:AppButtonGroupPositiveNegativeProps) {
  const {
    className,
      buttonProps,
    negativeLabel,
    negativeHandler,
    positiveLabel,
    positiveHandler,
    children,
    
    ...other
  } = props
  
  return <AppButtonGroupPositiveNegativeRoot
    className={clsx(appButtonGroupPositiveNegativeClasses.root, {}, className)}
    {...other}
  >
        {children}
        <Button
            color="error"
            size="medium"
            variant="outlined"
            onClick={negativeHandler}
            {...buttonProps}
        >
          {negativeLabel}
        </Button>
        
        <Button
            color="primary"
            variant="contained"
            onClick={positiveHandler}
            {...buttonProps}
        >
          {positiveLabel}
        </Button>
  </AppButtonGroupPositiveNegativeRoot>
}

export interface AppButtonGroupFormikPositiveNegativeProps<T = any> extends Omit<AppButtonGroupPositiveNegativeProps, "positiveHandler" | "negativeHandler">, Pick<FormikContextType<any>,"isSubmitting" | "resetForm" | "submitForm"> {
  item?: T
  negativeHandler?: React.MouseEventHandler
  positiveHandler?: React.MouseEventHandler,
  
}


/**
 * AppButtonGroupPositiveNegative Component
 *
 * @param { AppButtonGroupPositiveNegativeProps } props
 */
export function AppButtonGroupFormikPositiveNegative<T = any>(props:AppButtonGroupFormikPositiveNegativeProps<T>) {
  const {
    className,
    item,
      positiveHandler,
      negativeHandler,
    isSubmitting, submitForm, resetForm,
    ...other
  } = props
  
  
  
  
  return <AppButtonGroupPositiveNegative
      className={clsx(appButtonGroupPositiveNegativeClasses.root, {}, className)}
      negativeHandler={e => {
        e.preventDefault()
        if (negativeHandler) {
          negativeHandler(e)
        } else if (!isSubmitting) {
          resetForm()
        }
      }}
      positiveHandler={e => {
        e.preventDefault()
        if (positiveHandler) {
          positiveHandler(e)
          return
        } else if (isSubmitting) {
          return
        }
        
        submitForm()
      }}
      {...other}
  />
}



export default AppButtonGroupPositiveNegative
