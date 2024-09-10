import ReactDOM from 'react-dom/client';
import React from "react"
import { importDefault } from "vrkit-app-common/utils"

async function renderRoot(root: ReactDOM.Root) {
  const AppContainer = await importDefault(import("./AppContainer"))
  const AppInitializationContainer = await importDefault(
    import("../../components/app-initialization-container")
  )

  function Root() {
    return (
      <AppInitializationContainer>
        <AppContainer />
      </AppInitializationContainer>
    )
  }
  root.render(<Root />)
  //console.log("Initialized All, should render root")
}

export default renderRoot
