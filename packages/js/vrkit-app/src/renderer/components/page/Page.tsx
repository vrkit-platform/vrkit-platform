// REACT
import React from "react"

// CLSX
import clsx from "clsx"

// 3FV
import { getLogger } from "@3fv/logger-proxy"

// MUI

// APP
import { ClassNamesKey, createClassNames } from "@vrkit-platform/shared-ui"
import { PageMetadata, PageMetadataProps } from "./metadata"
import PageContainer, { PageContainerProps } from "../app-page-container"

import { PageContent } from "./PageContent"

const log = getLogger(__filename)
const { info, debug, warn, error } = log

const classPrefix = "Page"
export const pageClasses = createClassNames(classPrefix, "root")
export type PageClassKey = ClassNamesKey<typeof pageClasses>

/**
 * Page Component Properties
 */
export interface PageProps extends  PageContainerProps {
  metadata?: PageMetadataProps
}

/**
 * Page Component
 *
 * @param { PageProps } props
 */
export function Page({ metadata, className, children,  ...other }: PageProps) {
  return (
    <PageContent>
      <PageContainer
        className={clsx(className)}
        {...other}
      >
        <PageMetadata {...metadata}/>
        {children}
      </PageContainer>
    </PageContent>
  )
}

export default Page
