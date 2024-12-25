// REACT
import React from "react"

// CLSX
import clsx from "clsx"

// 3FV
import { getLogger } from "@3fv/logger-proxy"

// MUI
import Box, {type BoxProps} from "@mui/material/Box"
import { styled } from "@mui/material/styles"

// APP LIBS
import {
  child,
  ClassNamesKey,
  createClassNames,
  hasCls,
  flexAlign,
  FlexAuto,
  FlexColumn,
  OverflowVisible,
  PositionRelative
} from "@vrkit-platform/shared-ui"

// APP
import { AppContent } from "vrkit-app-renderer/components/app"
import AppPageContainer, {
  AppPageContainerProps
} from "../../components/app-page-container"

const log = getLogger(__filename),
  { info, debug, warn, error } = log

/**
 * PluginsPage Component Properties
 */
export interface PluginsPageProps extends AppPageContainerProps {

}


export function PluginsPage({className, ...other}: PluginsPageProps) {
  return (
    <AppContent>
      <AppPageContainer className={clsx(className)} {...other}>
        PluginsPage content here
      </AppPageContainer>
    </AppContent>
  )
}

export default PluginsPage
