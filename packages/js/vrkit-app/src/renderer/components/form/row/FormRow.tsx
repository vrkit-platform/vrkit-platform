// REACT
import React, { HTMLAttributes } from "react"

// CLSX

// 3FV
import { getLogger } from "@3fv/logger-proxy"

// MUI
import { styled } from "@mui/material/styles"
import type { GridProps } from "@mui/material"
import { Box, Grid } from "@mui/material"

// APP
import {
  ClassNamesKey,
  createClassNames, FillWidth,
  FlexAuto,
  FlexRow,
  widthConstraint
} from "@vrkit-platform/shared-ui/styles"
import { BoxProps } from "@mui/material/Box"

const log = getLogger(__filename)
const { info, debug, warn, error } = log

const classPrefix = "formRow"
export const formRowClasses = createClassNames(classPrefix, "root")
export type FormRowClassKey = ClassNamesKey<typeof formRowClasses>

const FormRowRoot = styled<typeof Box>(Box, {
  name: "FormRowRoot",
  label: "FormRowRoot"
})(({ theme }) => ({
  // root styles here
  [`&,&.${formRowClasses.root}`]: {
    ...FlexRow,
    ...FlexAuto,
    ...FillWidth,
    gap: theme.spacing(4)

  }
}))

/**
 * FormRow Component Properties
 */
export interface FormRowProps
  extends BoxProps {}

/**
 * FormRow Component
 *
 * @param { FormRowProps } props
 * @returns {JSX.Element}
 */
export function FormRow(props: FormRowProps) {
  const { ...other } = props

  return (
    <FormRowRoot
      {...other}
    />

  )
}

export default FormRow
