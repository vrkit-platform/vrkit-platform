// REACT
import React from "react"

// CLSX
import clsx from "clsx"

// 3FV
import { getLogger } from "@3fv/logger-proxy"

// MUI
import Box from "@mui/material/Box"
import type {BoxProps} from "@mui/material/Box"
import { darken, styled } from "@mui/material/styles"

// APP
import {
  ClassNamesKey,
  createClassNames,
  hasCls,
  flexAlign,
  FlexRow,
  FillWidth,
  FlexAuto, padding
} from "vrkit-shared-ui"
import AppBreadcrumbs from "../app-breadcrumbs"
import { usePageMetadata } from "../page-metadata"

const log = getLogger(__filename)
const { info, debug, warn, error } = log


export interface AppContentBarOverrides {
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
      pm = usePageMetadata()
  

  return <AppContentBarRoot
    className={clsx(appContentBarClasses.root, {}, className)}
    {...other}
  >
    {/* BREAD CRUMBS */}
    <AppBreadcrumbs/>
    
    {/* PAGE SPECIFIC ACTIONS */}
    {pm.appContentBar?.actions ?? <></>}
  </AppContentBarRoot>
}

export default AppContentBar
