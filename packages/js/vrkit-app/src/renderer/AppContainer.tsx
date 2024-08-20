import { StrictMode, Suspense } from "react"
import { HashRouter } from "react-router-dom"
import { HelmetProvider } from "react-helmet-async"

import App from "./App"
import { CONFIG } from "./config-global"

export default function AppContainer() {
  return (
    <StrictMode>
      <HelmetProvider>
        <HashRouter basename={CONFIG.site.basePath}>
          <Suspense>
            <App />
          </Suspense>
        </HashRouter>
      </HelmetProvider>
    </StrictMode>
  )
}
