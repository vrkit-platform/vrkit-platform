import { Container } from "@3fv/ditsy"
import { getLogger } from "@3fv/logger-proxy"
import { OverlayClient } from "../../../services/overlay-client"

const log = getLogger(__filename)
const { info, debug, warn, error } = log


export async function init(container: Container) {
  debug(`init sessionManagerClient state`)
  const overlayClient = container.get(OverlayClient)
  info(`overlayClient initialized with config`, overlayClient.overlayConfig)
  
  
}

export default init
