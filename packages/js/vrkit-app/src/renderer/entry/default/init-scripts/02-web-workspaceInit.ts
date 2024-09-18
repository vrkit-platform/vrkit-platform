import { Container } from "@3fv/ditsy"
import { getLogger } from "@3fv/logger-proxy"
import { SessionManagerClient } from "../../../services/session-manager-client"

const log = getLogger(__filename)
const { info, debug, warn, error } = log

export async function init(container: Container) {
  info(`init sessionManagerClient state`)
  const sessionManagerClient = container.get(SessionManagerClient)
  const initState = await sessionManagerClient.getMainSessionManagerState()
  sessionManagerClient.updateState(initState)
  
  info(`init sessionManagerClient state completed`)
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
