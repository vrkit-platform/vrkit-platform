// REACT
import React from "react"

// CLSX
import clsx from "clsx"

// 3FV
import { getLogger } from "@3fv/logger-proxy"

// MUI
import Box from "@mui/material/Box"
import type { BoxProps } from "@mui/material/Box"
import { styled } from "@mui/material/styles"
import { Grid, GridProps, Theme } from "@mui/material"
import type { SxProps } from "@mui/system"

// APP
import {
  ClassNamesKey,
  createClassNames,
  createClasses,
  FlexRow,
  widthConstraint
} from "vrkit-shared-ui/styles"
import { isFunction } from "@3fv/guard"

const log = getLogger(__filename)
const { info, debug, warn, error } = log

const classPrefix = "FormItem"
export const formItemClasses = createClassNames(classPrefix, "root")
export type FormItemClassKey = ClassNamesKey<typeof formItemClasses>

// <Grid
// item
// key="form-row-1"
// alignItems="stretch"
// flex="0 0 auto"
// position="relative"
// justifyContent="stretch"
// flexDirection="row"
// columns={12}
// gap={4}
// sx={{...FlexRow, ...makeWidthConstraint(`min(100%, 80rem)`)}}
// >
const FormItemRoot = styled<typeof Grid>(Grid, {
  name: "FormItemRoot"
})(({ theme }) => ({
  [`&,&.${formItemClasses.root}`]: {

  }
}))

/**
 * FormItem Component Properties
 */
export interface FormItemProps extends Omit<GridProps, "item" | "container"> {}

/**
 * FormItem Component
 *
 * @param { FormItemProps } props
 * @returns {JSX.Element}
 */
export function FormItem(props: FormItemProps) {
  const { sx, children, className, ...other } = props

  return (
    <FormItemRoot
      item
      sx={theme => ({
        ...((isFunction(sx) ? sx(theme) : sx) as any)
      })}
      className={clsx(formItemClasses.root, className)}
      {...other}
    >
      {children}
    </FormItemRoot>
  )
}

export default FormItem
