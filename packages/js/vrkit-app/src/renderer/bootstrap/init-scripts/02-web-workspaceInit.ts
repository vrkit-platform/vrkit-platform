import { Container } from "@3fv/ditsy"
import { getLogger } from "@3fv/logger-proxy"

// import { EntityStateAdapter } from "@reduxjs/toolkit"
// import { isDev } from "../../constants"
import { SessionManager } from "../../services/session-manager-client"

const log = getLogger(__filename)
const { info, debug, warn, error } = log

export async function init(container: Container) {
  debug(`init sessionManager state`)
  const sessionManager = container.get(SessionManager)
  sessionManager.updateState()
  
  // let unsubscribe: Function = null
  //
  // if (import.meta.webpackHot) {
  //   import.meta.webpackHot.dispose(() => {
  //     if (unsubscribe) {
  //       unsubscribe()
  //     }
  //
  //     // dbChangeService.off("all", changeListener)
  //   })
  // }
}

export default init
