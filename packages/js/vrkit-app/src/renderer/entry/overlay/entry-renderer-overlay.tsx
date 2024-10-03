import ReactDOM from "react-dom/client"
import { get } from "lodash/fp"


async function start() {
  const renderRoot = await import("./renderOverlayRoot").then(get("default"))
  
  const
      rootEl = document.getElementById("root") as HTMLElement,
      root = ReactDOM.createRoot(rootEl)
  
  renderRoot(root).catch(err => console.error("failed to render root", err))
  
  if (import.meta.webpackHot) {
    import.meta.webpackHot.addDisposeHandler(() => {
      rootEl.innerHTML = ''
    })
  }
}

start()
    .catch(err => console.error("failed to start", err))

export {}
