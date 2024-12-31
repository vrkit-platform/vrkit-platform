import ReactDOM from "react-dom/client"
import { get } from "lodash/fp"
import LogServerRendererSetup from "../../../common/logger/renderer"


async function start() {
  window.addEventListener("error", (ev, ...args) => {
    console.error("Unhandled error", ev, args)
    ev?.preventDefault?.()
    ev?.stopPropagation?.()
  })
  window.addEventListener("unhandledrejection", (ev, ...args) => {
    console.error("unhandledrejection", ev, ...args)
    ev?.preventDefault?.()
    ev?.stopPropagation?.()
  })
  
  await LogServerRendererSetup()
  
  const renderRoot = await import("./renderOverlayRoot").then(get("default"))
  
  const
      rootEl = document.getElementById("root") as HTMLElement,
      root = ReactDOM.createRoot(rootEl)
  
  renderRoot(root).catch(err => console.error("failed to render root", err))
  
  // if (import.meta.webpackHot) {
  //   import.meta.webpackHot.addDisposeHandler(() => {
  //     rootEl.innerHTML = ''
  //   })
  // }
}

start()
    .catch(err => console.error("failed to start", err))

export {}
