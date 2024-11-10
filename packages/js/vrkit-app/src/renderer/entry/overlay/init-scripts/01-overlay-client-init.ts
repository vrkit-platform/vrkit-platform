import { Container } from "@3fv/ditsy"
import { getLogger } from "@3fv/logger-proxy"
import {
  OverlayManagerClient, PluginManagerClient
} from "../../../services/overlay-client"

const log = getLogger(__filename)
const { info, debug, warn, error } = log


export async function init(container: Container) {
  debug(`init sessionManagerClient state`)
  const overlayClient = container.get(OverlayManagerClient)
  info(`overlayClient initialized with config`, overlayClient.overlayConfig)
  const pluginClientManager = container.get(PluginManagerClient)
  await pluginClientManager.launch()
  
  
}

export default init
