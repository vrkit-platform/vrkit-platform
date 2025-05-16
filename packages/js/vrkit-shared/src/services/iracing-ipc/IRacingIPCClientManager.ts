import { getLogger } from "@3fv/logger-proxy"
import { PostConstruct, Singleton } from "@3fv/ditsy"
import { IRacingIPCClient } from "vrkit-native-interop"


// noinspection TypeScriptUnresolvedVariable
const log = getLogger(__filename)

// noinspection JSUnusedLocalSymbols
const { debug, trace, info, error, warn } = log




@Singleton()
export class IRacingIPCClientManager extends IRacingIPCClient {
  
  constructor() {
    super()
  }
  
  @PostConstruct()
  protected async init() {
    if (isDev) {
      Object.assign(global, {
        irc: this
      })
    }
    
    if (typeof window !== "undefined") {
      window.addEventListener("beforeunload", super.disconnect.bind(this))
    }
    
    info(`Connecting to iRacing IPC Server`)
    
    await super.connect()
  }
  
  /**
   * Cleanup resources on unload
   *
   * @protected
   */
  protected unload() {
    debug(`Unloading iRacing IPC Manager`)
    super.disconnect()
  }
  
  
}