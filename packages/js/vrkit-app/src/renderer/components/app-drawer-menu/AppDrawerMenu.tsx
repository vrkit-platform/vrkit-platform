// REACT
import React from "react"

// CLSX
import clsx from "clsx"

// 3FV
import { getLogger } from "@3fv/logger-proxy"

// MUI
import type {BoxProps} from "@mui/material/Box"
import { styled, useTheme } from "@mui/material/styles"
import { List, ListItem, ListItemIcon, type Theme } from "@mui/material"

// APP
import {
  borderRadius, ClassNamesKey,
  createClassNames,
  dimensionConstraints,
  flexAlign,
  hasCls
} from "vrkit-app-renderer/styles"
import { FlexColumnBox } from "../box"
import ListItemButton from "@mui/material/ListItemButton"
import ListItemText from "@mui/material/ListItemText"
import { NavLink, useLocation, useMatch, useNavigate } from "react-router-dom"
// import { startsWith } from "lodash/fp"
import { WebPaths } from "../../routes/WebPaths"

const log = getLogger(__filename)
const { info, debug, warn, error } = log

const classPrefix = "appDrawerMenu"
export const appDrawerMenuClasses = createClassNames(classPrefix, "root")
export type AppDrawerMenuClassKey = ClassNamesKey<typeof appDrawerMenuClasses>


const AppDrawerMenuRoot = styled(FlexColumnBox, {
  name: "AppDrawerMenuRoot",
  label: "AppDrawerMenuRoot"
})(({theme}) => ({
  // root styles here
  ...flexAlign("stretch", "stretch")
  
}))


/**
 * AppDrawerMenu Component Properties
 */
export interface AppDrawerMenuProps extends BoxProps {

}

// type NavPathMatcher = (path: string) => boolean
// , match: NavPathMatcher

interface NavListItemProps { path:string, label:string }

function NavListItem({path, label}:NavListItemProps) {
  const isActive = useMatch(path),
      navigate = useNavigate(),
      theme = useTheme()
  
  return <ListItemButton
      sx={{
        ...borderRadius("0.25rem"),
      ...(isActive && {backgroundColor: `${theme.palette.action.active}`})
      }}
      onClick={() => {
    navigate(path)
  }}>
    {/*<ListItemIcon>*/}
    {/*  {index % 2 === 0 ? <InboxIcon /> : <MailIcon />}*/}
    {/*</ListItemIcon>*/}
    <ListItemText primary={label} />
  </ListItemButton>
}

/**
 * AppDrawerMenu Component
 *
 * @param { AppDrawerMenuProps } props
 * @returns {JSX.Element}
 */
export function AppDrawerMenu(props:AppDrawerMenuProps) {
  const { ...other } = props,
      loc = useLocation()
  log.info(`Location details ${loc.pathname}`, loc)
  
  return <AppDrawerMenuRoot
    {...other}
  >
    <List>
      <ListItem >
        <NavListItem path={WebPaths.app.dashboards} label="Dashboards"/>
      </ListItem>
      
    </List>
  </AppDrawerMenuRoot>
}

export default AppDrawerMenu
