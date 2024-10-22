import ReactDOM from "react-dom/client"
import React from "react"
import { importDefault } from "vrkit-shared"
import { resolveContainer } from "./containerFactory"

async function renderRoot(root: ReactDOM.Root) {
  const AppContainer = await importDefault(import("./AppContainer"))
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

export default renderRoot
