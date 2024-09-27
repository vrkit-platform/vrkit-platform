import { StrictMode, Suspense } from "react"
import { HashRouter } from "react-router-dom"
import { HelmetProvider } from "react-helmet-async"

import App from "./App"
import { DefaultConfig } from "../../config-global"
import { PageMetadataProvider } from "../../components/page-metadata"

export default function AppContainer() {
  return (
    <StrictMode>
      <PageMetadataProvider>
        <HelmetProvider>
          <HashRouter basename={DefaultConfig.app.basePath}>
            <Suspense>
              <App />
            </Suspense>
          </HashRouter>
        </HelmetProvider>
      </PageMetadataProvider>
    </StrictMode>
  )
}
