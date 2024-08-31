import React, { useCallback, useContext, useEffect, useState } from "react"
import { Helmet } from "react-helmet-async"
import { defaults } from "lodash"


import { getLogger } from "@3fv/logger-proxy"
import type { BoxProps } from "@mui/material/Box"
import { AppBarContentOverrides } from "vrkit-app-renderer/layouts/core/MainAppBar"
//import type { AppBarContentOverrides } from "../../layouts/main/MainAppBar"

const log = getLogger(__filename)
const { info, debug, warn, error } = log

export interface PageMetadata {
  title: string
	section?: string
  SectionProps?: BoxProps
  appBar?: PageAppBarMetadata

	// controls?: ReactInstanceOrType | Array<ReactInstanceOrType>
}


export interface PageAppBarMetadata {
	height?: number
	content?: AppBarContentOverrides
}

const defaultPageMetadata = (): PageMetadata => ({
  title: "TaskX",
	section: "",
  appBar: {
		content: {}
	}
})

export interface PageMetadataContext extends PageMetadata {
  set(metadata: Partial<PageMetadata>): PageMetadata
}

export const PageMetadataContext =
  React.createContext<PageMetadataContext>(null)

export function PageMetadataProvider({
  children
}: React.PropsWithChildren<any>) {
  const [pageMetadata, setPageMetadata] = useState<PageMetadata>({
      ...defaultPageMetadata()
    }),
    set = useCallback(
      (patch: Partial<PageMetadata>) => {
        // apply defaults
        const newMetadata = defaults(patch,defaultPageMetadata())

        // Set & return result
        setPageMetadata(newMetadata)

        return newMetadata
      },
      [pageMetadata]
    )

  return (
    <PageMetadataContext.Provider value={{ ...pageMetadata, set }}>
      {children}
    </PageMetadataContext.Provider>
  )
}

export interface PageMetadataProps
  extends PageMetadata,
    React.PropsWithChildren<any> {}

export function PageMetadata({ children, ...patch }: PageMetadataProps) {
  const ctx = useContext(PageMetadataContext)

	useEffect(() => {
    if (Object.entries(patch).some(([key, value]) => ctx[key] !== value)) {
      ctx.set(patch)
    }
  }, [patch])

	return (
    <>
      <Helmet>
        <title>{ctx.title ?? "VRKit"}</title>
      </Helmet>
      {children}
    </>
  )
}


export const usePageMetadata = () => useContext(PageMetadataContext)
