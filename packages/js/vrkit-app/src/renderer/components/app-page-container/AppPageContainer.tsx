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
  flexAlign,
  FlexAuto,
  FlexColumn,
  hasCls,
  OverflowVisible, PositionRelative
} from "@vrkit-platform/shared-ui"

const log = getLogger(__filename)
const { info, debug, warn, error } = log

const classPrefix = "appPageContainer"
export const appPageContainerClasses = createClassNames(classPrefix, "root")
const classes = appPageContainerClasses

export type AppPageContainerClassKey = ClassNamesKey<typeof appPageContainerClasses>


const AppPageContainerRoot = styled(Box, {
  name: "AppPageContainerRoot",
  label: "AppPageContainerRoot"
})(({theme: {dimen,palette, shape, customShadows, shadows, components, colors, transitions, typography, insetShadows, mixins, zIndex, spacing }}) => ({
  // root styles here
  [hasCls(appPageContainerClasses.root)]: {
    ...FlexAuto,
    ...OverflowVisible,
    ...FlexColumn,
    ...flexAlign("stretch", "stretch"),
    ...PositionRelative,
    
  }
}))


/**
 * AppPageContainer Component Properties
 */
export interface AppPageContainerProps extends BoxProps {

}


/**
 * AppPageContainer Component
 *
 * @param { AppPageContainerProps } props
 */
export function AppPageContainer(props:AppPageContainerProps) {
  const { className, ...other } = props

  return <AppPageContainerRoot
    className={clsx(classes.root, {}, className)}
    {...other}
  />
}

export default AppPageContainer
