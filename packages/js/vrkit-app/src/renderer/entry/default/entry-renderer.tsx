import ReactDOM from "react-dom/client"
import { get } from "lodash/fp"
import LogServerRendererSetup from "../../../common/logger/renderer"

process.on("uncaughtException",(...args:any[]) => {
  console.error("uncaughtException", args)
})

process.on("unhandledRejection",(...args:any[]) => {
  console.error("unhandledRejection", args)
})

async function start() {
  if (process.env.NODE_ENV !== "production") {
    Object.assign(global, {
      webpackRequire: __webpack_require__,
      // webpackResolve: (name: string) => require.resolve(name),
      webpackModules: __webpack_modules__,
      nodeRequire: __non_webpack_require__,
    })
  }
  
  await LogServerRendererSetup()
  
  const
      renderRoot = await import("./renderRoot").then(get("default")),
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
