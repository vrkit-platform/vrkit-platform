import { createBrowserHistory } from "history"
import { asOption } from "@3fv/prelude-ts"

const hot = import.meta.webpackHot // import.meta.webpackHot
export const history = asOption(hot?.data?.history as ReturnType<typeof createBrowserHistory>)
  .getOrCall(() => createBrowserHistory())

if (hot) {
  hot.dispose(data => Object.assign(data, {
    history
  }))
}
