// REACT
import React from "react"

// CLSX
import clsx from "clsx"

// 3FV
import { getLogger } from "@3fv/logger-proxy"

// MUI
import type { BoxProps } from "@mui/material/Box"
import { styled, useTheme } from "@mui/material/styles"
import { List, ListItem, ListItemIcon } from "@mui/material"
import ExtensionIcon from "@mui/icons-material/Extension"
// APP
import {
  alpha,
  borderRadius,
  ClassNamesKey,
  createClassNames,
  flexAlign,
  FlexColumnBox,
  FlexRowCenter,
  hasCls
} from "@vrkit-platform/shared-ui"
import ListItemButton from "@mui/material/ListItemButton"
import ListItemText from "@mui/material/ListItemText"
import { useLocation, useMatch, useNavigate } from "react-router-dom"
import { WebPaths } from "../../routes/WebPaths"
import type { IconDefinition } from "@fortawesome/fontawesome-common-types"
import { faGridHorizontal } from "@awesome.me/kit-79150a3eed/icons/duotone/solid"
import { AppFAIcon, isFAIconDefinition } from "../app-icon"
import { isObject } from "@3fv/guard"

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
  ...flexAlign("stretch", "stretch")
}))

export const appListItemClasses = createClassNames(classPrefix, "root", "active")

const AppListItemButton = styled(ListItemButton, {
  name: "AppListItemButton",
  label: "AppListItemButton"
})(({ theme }) => ({
  // root styles here
  [hasCls(appListItemClasses.root)]: {
    ...borderRadius("0.25rem"),

    [hasCls(appListItemClasses.active)]: {
      backgroundColor: `${alpha(theme.palette.action.active, 0.25)}`
    }
  }
}))

/**
 * AppDrawerMenu Component Properties
 */
export interface AppDrawerMenuProps extends BoxProps {}

interface NavListItemProps {
  path: string

  label: string

  icon: IconDefinition | React.ReactNode

  exact?: boolean
}



function NavListItem({ path, icon, label, exact = false }: NavListItemProps) {
  const isActive = useMatch({ path, caseSensitive: false, end: exact }),
    navigate = useNavigate(),
    theme = useTheme()

  return (
    <AppListItemButton
      className={clsx(appListItemClasses.root, {
        [appListItemClasses.active]: isActive
      })}
      onClick={() => {
        navigate(path)
      }}
    >
      <ListItemIcon sx={{ ...FlexRowCenter }}>
        {isFAIconDefinition(icon) ? (<AppFAIcon
          icon={icon}
          size="lg"
        />) : icon}
      </ListItemIcon>
      <ListItemText
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
  const { ...other } = props,
    loc = useLocation()
  // log.info(`Location details ${loc.pathname}`, loc)

  return (
    <AppDrawerMenuRoot {...other}>
      <List>
        <ListItem>
          <NavListItem
            path={WebPaths.app.dashboards}
            label="Dashboards"
            icon={faGridHorizontal}
          />
        </ListItem>
        <ListItem>
          <NavListItem
              path={WebPaths.app.plugins}
              label="Plugins"
              icon={<ExtensionIcon/>}
          />
        </ListItem>
      </List>
    </AppDrawerMenuRoot>
  )
}

export default AppDrawerMenu
