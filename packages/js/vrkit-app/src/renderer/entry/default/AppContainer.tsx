import { StrictMode, Suspense } from "react"
import { MemoryRouter,HashRouter } from "react-router-dom"
import { HelmetProvider } from "react-helmet-async"

import App from "./App"
import { DefaultConfig } from "../../config-global"
import { PageMetadataProvider } from "../../components/page"

export default function AppContainer() {
  return (
    <StrictMode>
      <PageMetadataProvider>
        <HelmetProvider>
          <MemoryRouter basename={DefaultConfig.app.basePath}>
            <Suspense>
              <App />
            </Suspense>
          </MemoryRouter>
        </HelmetProvider>
      </PageMetadataProvider>
    </StrictMode>
  )
}
