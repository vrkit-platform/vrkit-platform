import ReactDOM from "react-dom/client"
import { get } from "lodash/fp"

process.on("uncaughtException",(...args:any[]) => {
  console.error("uncaughtException", args)
})

process.on("unhandledRejection",(...args:any[]) => {
  console.error("unhandledRejection", args)
})

async function start() {
  const renderRoot = await import("./renderRoot").then(get("default"))
  
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
