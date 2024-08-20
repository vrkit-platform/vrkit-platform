import { Container } from "@3fv/ditsy"
import { getLogger } from "@3fv/logger-proxy"
// import "@taskx/lib-shared-web/WebGlobalTypes"
import { observeAppStore } from "../../services/store"
import { selectSettings } from "../../services/store/selectors"

const log = getLogger(__filename)
const { info, debug, warn, error } = log

export async function init(container: Container) {
  debug(`init settings persistence`)

  const unsubscribe = observeAppStore(selectSettings, newSettings => {
    // if (!!newSettings) {
    //   saveAppSettingsSync(newSettings)
    //   windowEventEmitter.emit("settingsChanged", newSettings)
    // }
  })

  if (module.hot) {
    module.hot.addDisposeHandler(unsubscribe)
  }
}

export default init
