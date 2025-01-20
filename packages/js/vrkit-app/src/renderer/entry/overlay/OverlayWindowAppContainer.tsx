import { StrictMode, Suspense } from "react"
import { HelmetProvider } from "react-helmet-async"

import OverlayWindowApp from "./OverlayWindowApp"
import { PageMetadataProvider } from "../../components/page"

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
