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
import { Page, PageContent } from "vrkit-app-renderer/components/page"
import PageContainer, {
  PageContainerProps
} from "../../components/app-page-container"
import { PageMetadata, PageMetadataProps } from "../../components/page"
import PluginsTabView from "../../components/plugins-tab-view"

const log = getLogger(__filename),
  { info, debug, warn, error } = log

/**
 * PluginsPage Component Properties
 */
export interface PluginsPageProps extends PageContainerProps {

}


export function PluginsPage({className, ...other}: PluginsPageProps) {
  const pageMetadata: PageMetadataProps = {
    appContentBar: {
      actions: <></>
    }
  }
  
  return (
    <Page metadata={pageMetadata} >
      <PluginsTabView/>
    </Page>
  )
}

export default PluginsPage
