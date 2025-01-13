
if (import.meta.webpackHot) {
  import.meta.webpackHot.accept("./launch", (...args) => {
    console.warn("HMR accept called launch", ...args)
  })
}
import("./launch")

export {}
