// REACT
import React from "react"

// CLSX
import clsx from "clsx"

// 3FV
import { getLogger } from "@3fv/logger-proxy"

// MUI
import Box, {type BoxProps} from "@mui/material/Box"
import { styled } from "@mui/material/styles"

// APP
import {
  child,
  ClassNamesKey,
  createClassNames,
  flex,
  flexAlign,
  FlexAuto,
  FlexColumn,
  FlexColumnCenter,
  hasCls,
  OverflowHidden, padding
} from "@vrkit-platform/shared-ui"

const log = getLogger(__filename)
const { info, debug, warn, error } = log

const classPrefix = "noData"
export const noDataClasses = createClassNames(classPrefix, "root", "content")
const classes = noDataClasses

export type NoDataClassKey = ClassNamesKey<typeof noDataClasses>


const NoDataRoot = styled(Box, {
  name: "NoDataRoot",
  label: "NoDataRoot"
})(({theme: {dimen,palette, shape, customShadows, shadows, components, colors, transitions, typography, insetShadows, mixins, zIndex, spacing }}) => ({
  // root styles here
  [hasCls(noDataClasses.root)]: {
    ...flex(1,0,"auto"),
    ...FlexColumn,
    ...flexAlign("stretch","center"),
    ...OverflowHidden,
    [child(noDataClasses.content)]: {
      ...padding(spacing(1)),
      ...FlexAuto,
      ...typography.h5,
      textAlign: "center"
    }
  }
}))


/**
 * NoData Component Properties
 */
export interface NoDataProps extends BoxProps {

}


/**
 * NoData Component
 *
 * @param { NoDataProps } props
 */
export function NoData(props:NoDataProps) {
  const { children, className, ...other } = props

  return <NoDataRoot
    className={clsx(noDataClasses.root, {}, className)}
    {...other}
  >
    <Box className={clsx(classes.content)}>
      {children}
    </Box>
  </NoDataRoot>
}

export default NoData
