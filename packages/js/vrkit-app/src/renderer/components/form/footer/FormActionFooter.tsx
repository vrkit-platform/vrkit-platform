// REACT
import React from "react"

// CLSX

// 3FV
import { getLogger } from "@3fv/logger-proxy"

import type { BoxProps } from "@mui/material/Box"
// MUI
import Box from "@mui/material/Box"
import { styled } from "@mui/material/styles"

// APP
import {
  ClassNamesKey,
  createClassNames,
  FlexAuto,
  FlexDefaults,
  FlexRow,
  flexAlign,
  padding
} from "vrkit-shared-ui/styles"
// import { footerBorder } from "../../../theme"
const footerBorder = `1px solid rgba(0, 0, 0, 0.23)`

const log = getLogger(__filename)
const { info, debug, warn, error } = log

const classPrefix = "formActionFooter"
export const formActionFooterClasses = createClassNames(classPrefix, "child1")
export type FormActionFooterClassKey = ClassNamesKey<
  typeof formActionFooterClasses
>

const FormActionFooterRoot = styled(Box)(({ theme }) => ({
  ...FlexRow,
  ...FlexAuto,
  ...FlexDefaults.stretchSelf,
  ...flexAlign("center", "flex-end"),
  ...padding(theme.spacing(1),theme.spacing(1.5)),
  
  gap: theme.spacing(2),
  borderTop: footerBorder,
  backgroundColor: theme.palette.background.actionFooter,
  backgroundImage: theme.palette.background.actionFooterImage
}))

/**
 * FormActionFooter Component Properties
 */
export interface FormActionFooterProps extends BoxProps {}

/**
 * FormActionFooter Component
 *
 * @param { FormActionFooterProps } props
 */
export function FormActionFooter(props: FormActionFooterProps) {
  return <FormActionFooterRoot {...props} />
}

export default FormActionFooter
