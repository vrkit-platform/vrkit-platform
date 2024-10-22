import ReactDOM from "react-dom/client"
import React, { lazy, Suspense } from "react"
import { importDefault } from "vrkit-shared"
import { resolveContainer } from "./overlayContainerFactory"

async function renderOverlayRoot(root: ReactDOM.Root) {
  const container = await resolveContainer().promise
  const AppContainer = await importDefault(import("./OverlayWindowAppContainer"))
  const AppInitializationContainer = await importDefault(import("../../components/app-initialization-container"))

  function Root() {
    return (
      <AppInitializationContainer resolveContainer={resolveContainer}>
      
        <AppContainer />
      
      </AppInitializationContainer>
    )
  }

  root.render(<Root />)
}

export default renderOverlayRoot
