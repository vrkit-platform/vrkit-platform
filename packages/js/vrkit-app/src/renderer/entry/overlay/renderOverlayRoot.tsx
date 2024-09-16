import ReactDOM from "react-dom/client"
import React from "react"
import { importDefault } from "vrkit-app-common/utils"
import { resolveContainer } from "./overlayContainerFactory"

async function renderOverlayRoot(root: ReactDOM.Root) {
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
