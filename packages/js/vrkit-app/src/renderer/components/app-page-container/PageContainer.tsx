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
  createClassNames, flex,
  flexAlign,
  FlexAuto,
  FlexColumn,
  hasCls,
  OverflowHidden,
  OverflowVisible,
  PositionRelative
} from "@vrkit-platform/shared-ui"

const log = getLogger(__filename)
const { info, debug, warn, error } = log

const classPrefix = "appPageContainer"
export const appPageContainerClasses = createClassNames(classPrefix, "root")
const classes = appPageContainerClasses

export type AppPageContainerClassKey = ClassNamesKey<typeof appPageContainerClasses>


const PageContainerRoot = styled(Box, {
  name: "AppPageContainerRoot",
  label: "AppPageContainerRoot"
})(({theme: {dimen,palette, shape, customShadows, shadows, components, colors, transitions, typography, insetShadows, mixins, zIndex, spacing }}) => ({
  // root styles here
  [hasCls(appPageContainerClasses.root)]: {
    ...FlexAuto,
    ...flex(1,1,0),
    ...OverflowHidden,
    ...FlexColumn,
    ...flexAlign("stretch", "stretch"),
    ...PositionRelative,
    
  }
}))


/**
 * AppPageContainer Component Properties
 */
export interface PageContainerProps extends BoxProps {

}


/**
 * AppPageContainer Component
 *
 * @param { PageContainerProps } props
 */
export function PageContainer(props:PageContainerProps) {
  const { className, ...other } = props

  return <PageContainerRoot
    className={clsx(classes.root, {}, className)}
    {...other}
  />
}

export default PageContainer
