import { getLogger } from "@3fv/logger-proxy"
import EventEmitter3 from "eventemitter3"

// noinspection TypeScriptUnresolvedVariable
const log = getLogger(__filename)

// noinspection JSUnusedLocalSymbols
const { debug, trace, info, error, warn } = log

export abstract class ElectronIntegratedService<EventTypeMap extends {} = {}> extends EventEmitter3<EventTypeMap> {
  protected attach() {}

  protected destroy() {}

  [Symbol.dispose]() {}

  /**
   * Service constructor
   *
   */
  constructor() {
    super()

    if (typeof window !== "undefined") {
      window.addEventListener("beforeunload", () => {
        this?.[Symbol.dispose]?.()
      })
    }
  }
}

export default ElectronIntegratedService
