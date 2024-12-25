// REACT
import React from "react"

// CLSX
import clsx from "clsx"

// 3FV
import { getLogger } from "@3fv/logger-proxy"

// MUI
import HomeIcon from "@mui/icons-material/Home"

import { Link as NavLink, useLocation } from "react-router-dom"

import Link from "@mui/material/Link"
import Typography from "@mui/material/Typography"
import Breadcrumbs, { BreadcrumbsProps, breadcrumbsClasses as muiBreadcrumbsClasses } from "@mui/material/Breadcrumbs"
import { styled } from "@mui/material/styles"

// APP
import {
  child,
  ClassNamesKey,
  createClassNames,
  Ellipsis,
  flex,
  FlexAuto,
  FlexRow,
  hasCls,
  notHasCls, OverflowHidden
} from "@vrkit-platform/shared-ui"

const log = getLogger(__filename)
const { info, debug, warn, error } = log

const classPrefix = "appBreadcrumb"
export const appBreadcrumbClasses = createClassNames(classPrefix, "root", "link")
export type AppBreadcrumbClassKey = ClassNamesKey<typeof appBreadcrumbClasses>

const AppBreadcrumbRoot = styled(Breadcrumbs, {
  name: "AppBreadcrumbRoot",
  label: "AppBreadcrumbRoot"
})(({ theme: { spacing } }) => ({
  // root styles here
  [hasCls(appBreadcrumbClasses.root)]: {
    ...FlexRow,
    [child(appBreadcrumbClasses.link)]: {
      ...FlexAuto
    },
    [child(muiBreadcrumbsClasses.ol)]: {
      columnGap: spacing(1),
      flexWrap: "nowrap",
      ...flex(0,1,"auto"),
      [child(muiBreadcrumbsClasses.li)]: {
        [notHasCls(muiBreadcrumbsClasses.separator)]: {
          "&, & p, & a": {
            ...OverflowHidden,
            ...Ellipsis, flexShrink: 1
          }
        }
      }
    }
  }
}))

/**
 * AppBreadcrumb Component Properties
 */
export interface AppBreadcrumbsProps extends BreadcrumbsProps {}

/**
 * AppBreadcrumb Component
 *
 * @param { AppBreadcrumbsProps } props
 */

export function AppBreadcrumbs(props: AppBreadcrumbsProps) {
  const { className, ...other } = props
  const location = useLocation()
  const pathParts = location.pathname.split("/").filter(x => x)

  return (
    <AppBreadcrumbRoot
      className={clsx(appBreadcrumbClasses.root, {}, className)}
      aria-label="breadcrumb"
      {...other}
    >
      {pathParts.map((value, index) => {
        const last = index === pathParts.length - 1
        const to = `/${pathParts.slice(0, index + 1).join("/")}`

        return last ? (
          <Typography
            color="text.primary"
            key={to}
          >
            {value}
          </Typography>
        ) : (
          <Link
            component={NavLink}
            underline="hover"
            color="inherit"
            to={to}
            key={to}
          >
            {value === "app" ? <HomeIcon/> : value}
          </Link>
        )
      })}
    </AppBreadcrumbRoot>
  )
}

export default AppBreadcrumbs
