import ReactDOM from "react-dom/client"
import { get } from "lodash/fp"
import "./window-process-error-handling"
import LogServerRendererSetup from "../../../common/logger/renderer"
import type { WindowConfig, ElectronIPCChannelKind } from "@vrkit-platform/shared"
import { ipcRenderer } from "electron"
import { guard } from "@3fv/guard"


async function start() {
  const windowConfig: WindowConfig = ipcRenderer.sendSync("getWindowConfig" satisfies ElectronIPCChannelKind)
  if (isDev)
    console.info(`WindowConfig`, windowConfig)
  
  window["VRKitWindowConfig"] = windowConfig
  
  if (process.env.NODE_ENV !== "production") {
    Object.assign(global, {
      webpackRequire: __webpack_require__,
      webpackModules: __webpack_modules__,
      nodeRequire: __non_webpack_require__,
    })
  }
  
  const
      rootEl = document.getElementById("root") as HTMLElement,
      appender = await LogServerRendererSetup()
  
  if (import.meta.webpackHot) {
    import.meta.webpackHot.addDisposeHandler(() => {
      guard(() => appender.closeImmediate())
      rootEl.innerHTML = ''
    })
  }
  
  const
      renderRoot = await import("./renderRoot").then(get("default")),
      root = ReactDOM.createRoot(rootEl)
  renderRoot(root).catch(err => console.error("failed to render root", err))
  
  
}

start()
    .catch(err => console.error("failed to start", err))

export {}
