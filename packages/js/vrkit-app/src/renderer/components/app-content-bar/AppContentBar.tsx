// REACT
import React from "react"

// CLSX
import clsx from "clsx"

// 3FV
import { getLogger } from "@3fv/logger-proxy"

// MUI
import Box from "@mui/material/Box"
import type {BoxProps} from "@mui/material/Box"
import { darken, styled, useTheme } from "@mui/material/styles"

// APP
import {
  ClassNamesKey,
  createClassNames,
  hasCls,
  flexAlign,
  FlexRow,
  FillWidth,
  FlexAuto,
  padding,
  FlexScaleZeroBox,
  FlexColumnBox,
  FlexScaleZero,
  EllipsisBox,
  FlexProperties, HeightProperties
} from "@vrkit-platform/shared-ui"
import AppBreadcrumbs from "../app-breadcrumbs"
import { usePageMetadata } from "../page-metadata"
import { isEmpty } from "@vrkit-platform/shared"

const log = getLogger(__filename)
const { info, debug, warn, error } = log

export function createAppContentBarLabel(text: string, icon?: React.ReactNode) {
  return !icon ? text : <>{icon}<EllipsisBox>{text}</EllipsisBox></>
}

export type AppContentBarLabelArgs = [text: string, icon?: React.ReactNode]
export function createAppContentBarLabels(labelArgs: AppContentBarLabelArgs[]) {
  return labelArgs.map(args => createAppContentBarLabel(...args))
}


export interface AppContentBarOverrides {
  title?: React.ReactNode | string
  actions?: React.ReactNode
}


const classPrefix = "appContentBar"
export const appContentBarClasses = createClassNames(classPrefix, "root")
export type AppContentBarClassKey = ClassNamesKey<typeof appContentBarClasses>



const AppContentBarRoot = styled(Box, {
  name: "AppContentBarRoot",
  label: "AppContentBarRoot"
})(({theme}) => ({
  // root styles here
  [hasCls(appContentBarClasses.root)]: {
    ...FillWidth,
    ...FlexRow,
    ...FlexAuto,
    ...flexAlign("space-between"),
    ...padding(theme.spacing(1.5), theme.spacing(2)),
    // ...flexAlign("space-between", "space-between"),
    transition: theme.transitions.create([...FlexProperties, ...HeightProperties]),
    borderBottom: `1px solid ${darken(theme.palette.background.actionFooter, 0.25)}`,
    backgroundColor: theme.palette.background.actionFooter,
    backgroundImage: theme.palette.background.actionFooterImage,
    filter: "drop-shadow(0px 2px 2px rgba(0,0,0, 0.25))",
    gap: theme.spacing(2),
  }
}))


/**
 * AppContentBar Component Properties
 */
export interface AppContentBarProps extends BoxProps {

}


/**
 * AppContentBar Component
 *
 * @param { AppContentBarProps } props
 */
export function AppContentBar(props:AppContentBarProps) {
  const { className, ...other } = props,
      pm = usePageMetadata(),
      theme = useTheme()
  

  return <AppContentBarRoot
    className={clsx(appContentBarClasses.root, {}, className)}
    {...other}
  >
    <FlexColumnBox sx={{
      ...FlexScaleZero,
      ...flexAlign("stretch", "flex-start"),
      gap: theme.spacing(0.25),
    }}>
      {/* PAGE TITLE */}
      {pm.appContentBar?.title && <EllipsisBox
        sx={{...FlexAuto}}
      >{pm.appContentBar?.title}</EllipsisBox>}
      
      {/* BREAD CRUMBS */}
      <AppBreadcrumbs sx={{...FlexAuto}}/>
    </FlexColumnBox>
    {/* PAGE SPECIFIC ACTIONS */}
    {pm.appContentBar?.actions ?? <></>}
  </AppContentBarRoot>
}

export default AppContentBar
