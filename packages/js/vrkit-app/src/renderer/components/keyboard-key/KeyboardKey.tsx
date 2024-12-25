// REACT
import React from "react"

// CLSX
import clsx from "clsx"

// 3FV
import { getLogger } from "@3fv/logger-proxy"

// MUI
import Box from "@mui/material/Box"
import type {BoxProps} from "@mui/material/Box"
import { styled } from "@mui/material/styles"
import type { Theme, TypographyProps } from "@mui/material"
import type { SxProps } from "@mui/system"

// APP
import { ClassNamesKey, createClassNames, dimensionConstraints, child, hasCls } from "@vrkit-platform/shared-ui"
import Typography from "@mui/material/Typography"

const log = getLogger(__filename)
const { info, debug, warn, error } = log

const classPrefix = "keyboardKey"
export const keyboardKeyClasses = createClassNames(classPrefix, "root")
export type KeyboardKeyClassKey = ClassNamesKey<typeof keyboardKeyClasses>


const KeyboardKeyRoot = styled(Typography, {
  name: "KeyboardKeyRoot",
  label: "KeyboardKeyRoot"
})(({theme}) => ({
  // root styles here
  [hasCls(keyboardKeyClasses.root)]: {
    fontWeight: "sm",
    // borderColor: theme.palette.background.,
    borderStyle: "solid",
    // borderWidth: "1px 1px 3px",
    // backgroundColor: "background.level4",
    borderRadius: "0.35rem",
    px: 0.5,
    py: 0,
  }
})) as typeof Typography


/**
 * KeyboardKey Component Properties
 */
export interface KeyboardKeyProps extends Omit<TypographyProps, "component"> {

}


/**
 * KeyboardKey Component
 *
 * @param { KeyboardKeyProps } props
 * @returns {JSX.Element}
 */
export function KeyboardKey(props:KeyboardKeyProps) {
  const { className, children, ...other } = props

  return (
    <KeyboardKeyRoot
      className={clsx(keyboardKeyClasses.root, {}, className)}
      component="kbd"
      {...other}
    >
      {children}
    </KeyboardKeyRoot>
  )
}

export const Kbd = KeyboardKey

export default KeyboardKey
