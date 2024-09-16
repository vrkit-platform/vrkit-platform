import { StrictMode, Suspense } from "react"
import { HashRouter } from "react-router-dom"
import { HelmetProvider } from "react-helmet-async"

import OverlayWindowApp from "./OverlayWindowApp"
import { DefaultConfig } from "../../config-global"
import { PageMetadataProvider } from "../../components/page-metadata"

export default function OverlayWindowAppContainer() {
  return (
    <StrictMode>
      <PageMetadataProvider>
        <HelmetProvider>
            <Suspense>
              <OverlayWindowApp />
            </Suspense>
          
        </HelmetProvider>
      </PageMetadataProvider>
    </StrictMode>
  )
}
