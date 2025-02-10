import ReactDOM from "react-dom/client"
import React from "react"
import { type ElectronIPCChannelKind, importDefault, type WindowConfig } from "@vrkit-platform/shared"
import { resolveContainer } from "./overlayContainerFactory"
import { ipcRenderer } from "electron"

async function renderOverlayRoot(root: ReactDOM.Root) {
  const windowConfig: WindowConfig = ipcRenderer.sendSync("getWindowConfig" satisfies ElectronIPCChannelKind)
  if (isDev) {
    console.info(`WindowConfig`, windowConfig)
  }

  window["VRKitWindowConfig"] = windowConfig

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
