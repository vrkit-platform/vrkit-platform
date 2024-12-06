// REACT
import React from "react"

// CLSX
import clsx from "clsx"

// 3FV
import { getLogger } from "@3fv/logger-proxy"

// MUI
import { styled } from "@mui/material/styles"

// APP
import {
  ClassNamesKey,
  createClassNames,
  CssSelectors, FlexAuto,
  FlexRowCenter,
  hasCls,
  linearGradient,
  padding
} from "vrkit-shared-ui"
import ButtonBase, { ButtonBaseProps } from "@mui/material/ButtonBase"
import { ObjectValuesType, valuesOf } from "vrkit-shared"

const log = getLogger(__filename)
const { info, debug, warn, error } = log

const classPrefix = "appButton"

export const AppButtonVariants = {
  normal: "variantNormal",
  primary: "variantPrimary"
}

export type AppButtonVariant = keyof typeof AppButtonVariants

export type AppButtonVariantClassName = ObjectValuesType<typeof AppButtonVariants>

export const appButtonClasses = createClassNames(classPrefix, "root", "disabled", ...valuesOf(AppButtonVariants))
export type AppButtonClassKey = ClassNamesKey<typeof appButtonClasses>

const AppButtonRoot = styled("button", {
  name: "AppButtonRoot",
  label: "AppButtonRoot"
})(({ theme }) => ({
  // root styles here
  [hasCls(appButtonClasses.root)]: {
    // child styled here
    ...FlexRowCenter,
    ...FlexAuto,
    ...theme.typography.button,
    /* CSS */
    borderRadius: theme.shape.borderRadius, // boxSizing: "border-box",
    // color: "#FFFFFF",
    // fontFamily:
    //     '"SF Pro Text","SF Pro Icons","AOS Icons","Helvetica
    // Neue",Helvetica,Arial,sans-serif', fontSize: "17px", fontWeight:
    // 400, letterSpacing: "-.022em", lineHeight: 1.47059, minWidth:
    // "30px",
    // overflow: "visible",
    ...padding(theme.spacing(0.25), theme.spacing(2)),
    textAlign: "center",
    verticalAlign: "baseline",
    userSelect: "none",
    WebkitUserSelect: "none",
    touchAction: "manipulation",
    whiteSpace: "nowrap",
    
    [hasCls(appButtonClasses.disabled)]: {
      opacity: "0.3"
    },
    
    [hasCls(appButtonClasses.variantPrimary)]: {
      ...theme.components.AppButton?.variants?.primary,
      // backgroundImage: linearGradient("#42A1EC", "#0070C9"),
      // color: theme.palette.action.contrastText,
      border: "1px solid #0077CC",
      
      [CssSelectors.hover]: {
        backgroundImage: "linear-gradient(#51A9EE, #147BCD)",
        borderColor: "#1482D0",
        textDecoration: "none"
      },
      [CssSelectors.active]: {
        backgroundImage: "linear-gradient(#3D94D9, #0067B9)",
        borderColor: "#006DBC",
        outline: "none"
      },
      
    },
    
    
    [CssSelectors.focus]: {
      //boxShadow: "rgba(131, 192, 253, 0.5) 0 0 0 3px",
      boxShadow: theme.shadows[2],
      outline: "none"
    }
  }
}))

/**
 * AppButton Component Properties
 */
export interface AppButtonProps extends React.ComponentProps<"button"> {
  variant?: AppButtonVariant
}

/**
 * AppButton Component
 *
 * @param { AppButtonProps } props
 
 */
export function AppButton(props: AppButtonProps) {
  const { className, variant = "normal", children, ...other } = props

  return (
    <AppButtonRoot
      className={clsx(appButtonClasses.root, {
        [appButtonClasses.variantPrimary]: variant === "primary",
        [appButtonClasses.variantNormal]: variant === "normal",
      }, className)}
      {...other}
    >
      {children}
    </AppButtonRoot>
  )
}

export default AppButton
