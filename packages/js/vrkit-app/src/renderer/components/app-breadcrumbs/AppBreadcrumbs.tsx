// REACT
import React from "react"

// CLSX
import clsx from "clsx"

// 3FV
import { getLogger } from "@3fv/logger-proxy"

// MUI
import Box from "@mui/material/Box"

import { Link as NavLink, useLocation } from 'react-router-dom';

import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import Breadcrumbs, { BreadcrumbsProps} from '@mui/material/Breadcrumbs';

import type {BoxProps} from "@mui/material/Box"
import { styled } from "@mui/material/styles"

// APP
import {
  ClassNamesKey,
  createClassNames,
  dimensionConstraints,
  child,
  hasCls,
  FlexRowCenter,
  FlexAuto, FlexRow
} from "vrkit-shared-ui"

const log = getLogger(__filename)
const { info, debug, warn, error } = log

const classPrefix = "appBreadcrumb"
export const appBreadcrumbClasses = createClassNames(classPrefix, "root", "link")
export type AppBreadcrumbClassKey = ClassNamesKey<typeof appBreadcrumbClasses>


const AppBreadcrumbRoot = styled(Breadcrumbs, {
  name: "AppBreadcrumbRoot",
  label: "AppBreadcrumbRoot"
})(({theme}) => ({
  // root styles here
  [hasCls(appBreadcrumbClasses.root)]: {
    ...FlexAuto,
    ...FlexRow,
    [child(appBreadcrumbClasses.link)]: {
      ...FlexAuto
    }
  }
}))


/**
 * AppBreadcrumb Component Properties
 */
export interface AppBreadcrumbProps extends BreadcrumbsProps {

}


/**
 * AppBreadcrumb Component
 *
 * @param { AppBreadcrumbProps } props
 * @returns {JSX.Element}
 */

export function AppBreadcrumbs(props:AppBreadcrumbProps) {
  const { className, ...other } = props
  const location = useLocation();
  const pathParts = location.pathname.split('/').filter(x => x);
  
  return (
      <AppBreadcrumbRoot
          className={clsx(appBreadcrumbClasses.root, {}, className)}
          aria-label="breadcrumb"
          {...other}>
        {pathParts.map((value, index) => {
          const last = index === pathParts.length - 1;
          const to = `/${pathParts.slice(0, index + 1).join('/')}`;
          
          return last ? (
              <Typography color="text.primary" key={to}>
                {value}
              </Typography>
          ) : (
              <Link  component={NavLink} underline="hover" color="inherit" to={to} key={to}>
                {value}
              </Link>
          );
        })}
      </AppBreadcrumbRoot>
  );
  
}

export default AppBreadcrumbs
