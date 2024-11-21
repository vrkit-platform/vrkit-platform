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
} from "vrkit-shared-ui"
import ListItemButton from "@mui/material/ListItemButton"
import ListItemText from "@mui/material/ListItemText"
import { useLocation, useMatch, useNavigate } from "react-router-dom"
// import { startsWith } from "lodash/fp"
import { WebPaths } from "../../routes/WebPaths"
import type { IconDefinition } from "@fortawesome/fontawesome-common-types"
import { faGridHorizontal } from "@awesome.me/kit-79150a3eed/icons/duotone/solid"
import Icon from "../icon"

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

// type NavPathMatcher = (path: string) => boolean
// , match: NavPathMatcher

interface NavListItemProps {
  path: string

  label: string

  icon: IconDefinition

  exact?: boolean
}

function NavListItem({ path, icon, label, exact = false }: NavListItemProps) {
  const isActive = useMatch({ path, caseSensitive: false, end: exact }),
    navigate = useNavigate(),
    theme = useTheme()

  return (
    <AppListItemButton
      // disableGutters
      className={clsx(appListItemClasses.root, {
        [appListItemClasses.active]: isActive
      })}
      onClick={() => {
        navigate(path)
      }}
    >
      <ListItemIcon sx={{ ...FlexRowCenter }}>
        <Icon
          fa
          icon={icon}
          size="lg"
        />
        {/*  {index % 2 === 0 ? <InboxIcon /> : <MailIcon />}*/}
      </ListItemIcon>
      <ListItemText primary={label} />
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
      </List>
    </AppDrawerMenuRoot>
  )
}

export default AppDrawerMenu
