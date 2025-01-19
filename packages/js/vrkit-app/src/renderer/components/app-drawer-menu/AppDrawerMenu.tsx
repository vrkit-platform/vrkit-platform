// REACT
import React from "react"

// CLSX
import clsx from "clsx"

// 3FV
import { getLogger } from "@3fv/logger-proxy"

// MUI
import type { BoxProps } from "@mui/material/Box"
import { styled, useTheme } from "@mui/material/styles"
import  ListItem ,{ listItemClasses as muiListItemClasses } from "@mui/material/ListItem"
import ExtensionIcon from "@mui/icons-material/Extension"
// APP
import {
  alpha,
  borderRadius,
  child,
  ClassNamesKey,
  createClassNames, dimensionConstraints,
  flexAlign,
  FlexColumnBox,
  FlexProperties,
  FlexRowCenter,
  hasCls,
  margin,
  OverflowHidden,
  padding,
  widthConstraint,
  WidthProperties
} from "@vrkit-platform/shared-ui"
import ListItemButton from "@mui/material/ListItemButton"
import ListItemText from "@mui/material/ListItemText"
import { useLocation, useMatch, useNavigate } from "react-router-dom"
import { WebPaths } from "../../routes/WebPaths"
import type { IconDefinition } from "@fortawesome/fontawesome-common-types"
import { faGridHorizontal } from "@awesome.me/kit-79150a3eed/icons/duotone/solid"
import { AppFAIcon, isFAIconDefinition } from "../app-icon"
import { isObject } from "@3fv/guard"
import List from "@mui/material/List"
import ListItemIcon from "@mui/material/ListItemIcon"

const log = getLogger(__filename)
const { info, debug, warn, error } = log

const classPrefix = "appDrawerMenu"
export const appDrawerMenuClasses = createClassNames(classPrefix, "root", "hidden")
export type AppDrawerMenuClassKey = ClassNamesKey<typeof appDrawerMenuClasses>

const AppDrawerMenuRoot = styled(FlexColumnBox, {
  name: "AppDrawerMenuRoot",
  label: "AppDrawerMenuRoot"
})(({ theme }) => ({
  // root styles here
  ...flexAlign("stretch", "stretch"),
  [`& div.${muiListItemClasses.root}`]: {}
}))

export const appListItemClasses = createClassNames(classPrefix, "root", "active", "iconOnly", "icon", "detail")

const AppListItemButton = styled(ListItemButton, {
  name: "AppListItemButton",
  label: "AppListItemButton"
})(({ theme }) => ({
  // root styles here
  [hasCls(appListItemClasses.root)]: {
    ...borderRadius("0.25rem"),
    ...padding(0),
    ...margin(0),
    ...OverflowHidden,
    transition: theme.transitions.create([...WidthProperties]),
    width: "auto",

    [hasCls(appListItemClasses.active)]: {
      backgroundColor: `${alpha(theme.palette.action.active, 0.25)}`
    },
    
    [hasCls(appListItemClasses.iconOnly)]: {
      width: 50,
      minWidth: 50,
    },
    [child(appListItemClasses.icon)]: {
      ...dimensionConstraints(50)
    },
    [child(appListItemClasses.detail)]: {
    
    }
  }
}))

/**
 * AppDrawerMenu Component Properties
 */
export interface AppDrawerMenuProps extends BoxProps {
  expanded?: boolean
}

interface NavListItemProps {
  path: string

  label: string
  
  iconOnly?: boolean

  icon: IconDefinition | React.ReactNode

  exact?: boolean
}



function NavListItem({ path, iconOnly = false, icon, label, exact = false }: NavListItemProps) {
  const isActive = useMatch({ path, caseSensitive: false, end: exact }),
    navigate = useNavigate(),
    theme = useTheme()

  return (
    <AppListItemButton
      className={clsx(appListItemClasses.root, {
        [appListItemClasses.active]: isActive,
        [appListItemClasses.iconOnly]: iconOnly
      })}
      onClick={() => {
        navigate(path)
      }}
    >
      <ListItemIcon
        className={appListItemClasses.icon}
        sx={{ ...FlexRowCenter }}>
        {isFAIconDefinition(icon) ? (<AppFAIcon
          icon={icon}
          size="lg"
        />) : icon}
      </ListItemIcon>
      <ListItemText
        className={appListItemClasses.detail}
        primary={label}
        primaryTypographyProps={{ variant: "button" }}
      />
    </AppListItemButton>
  )
}

/**
 * AppDrawerMenu Component
 *
 * @param { AppDrawerMenuProps } props
 */
export function AppDrawerMenu(props: AppDrawerMenuProps) {
  const { expanded: isExpanded, ...other } = props,
    loc = useLocation()
  // log.info(`Location details ${loc.pathname}`, loc)

  return (
    <AppDrawerMenuRoot {...other}>
      <List disablePadding>
        <ListItem disablePadding disableGutters>
          <NavListItem
            path={WebPaths.app.dashboards}
            label="Dashboards"
            icon={faGridHorizontal}
            iconOnly={!isExpanded}
          />
        </ListItem>
        <ListItem disablePadding disableGutters>
          <NavListItem
              path={WebPaths.app.plugins}
              label="Plugins"
              icon={<ExtensionIcon/>}
              iconOnly={!isExpanded}
          />
        </ListItem>
      </List>
    </AppDrawerMenuRoot>
  )
}

export default AppDrawerMenu
