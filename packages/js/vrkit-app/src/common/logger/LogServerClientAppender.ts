import type { Appender, LogRecord } from "@3fv/logger-proxy"
import type { UPM } from "@3fv/electron-utility-process-manager"
import type { LogServerEventData, LogServerRequestMap } from "./LogServerTypes"
import { assign, defaults, toPlainObject } from "lodash"
import { Future } from "@3fv/prelude-ts"
import Debug from "debug"
import { JSONStringifyAny } from "@vrkit-platform/shared"
import { guard } from "@3fv/guard"
import EventEmitter3 from "eventemitter3"


const debug = Debug("vrkit:UPMLogServerClientAppender")

const getDefaultConfig = (): LogServerClientAppenderConfig => ({
  prettyPrint: false
})

function applyConfigDefaults(options: LogServerClientAppenderOptions): LogServerClientAppenderConfig {
  return defaults(options, getDefaultConfig())
}

export interface LogServerClientAppenderConfig {
  prettyPrint: boolean
}

export type LogServerClientAppenderOptions = Partial<LogServerClientAppenderConfig>

export interface LogServerClientAppenderEventMap {
  ready: (appender:LogServerClientAppender, ready: boolean) => any
  closed: (appender:LogServerClientAppender) => any
}

export class LogServerClientAppender extends EventEmitter3<LogServerClientAppenderEventMap> implements Appender {
  #messageClient: UPM.IMessageClient<LogServerRequestMap>
  
  readonly config: LogServerClientAppenderConfig

  private readonly state: {
    flushing: boolean
    flushContinue: boolean
    queue: Array<string>
    ready: boolean
    error?: Error
  } = {
    ready: false,
    flushing: false,
    flushContinue: false,
    queue: []
  }
  
  /**
   * setReady
   *
   * @param ready
   * @param skipEvent
   */
  setReady(ready: boolean, skipEvent: boolean = false) {
    const { state } = this
    if (state.ready === ready) {
      return this
    }
    
    state.ready = ready
    
    this.emit("ready", this, ready)
    return this
  }
  
  /**
   * Is ready & has valid client
   */
  isReady() {
    return this.state.ready && !!this.#messageClient
  }
  
  /**
   * Initialize and setup the appender
   *
   * @returns {LogServerClientAppender<Record>}
   */
  setMessageClient(
      messageClient: UPM.IMessageClient<LogServerRequestMap>
  ): LogServerClientAppender {
    if (Object.is(this.#messageClient, messageClient))
      return this
    
    if (this.#messageClient)
      this.closeImmediate(true)
    
    if (this.isReady())
      throw Error(`Something is funky, isReady should ALWAYS be false after closeImmediate(true)`)
    
    this.#messageClient = messageClient
    
    this.setReady(true)
    
    return this
  }
  
  /**
   * Close immediately
   */
  closeImmediate(skipEvent: boolean = false) {
    guard(() => {
      this.#messageClient?.close?.()
    }, err => {
      console.error(`Unable to cleanly stop messageClient`, err)
    })
    
    if (this.#messageClient) {
      this.#messageClient = null
    }
    
    if (!skipEvent) {
      this.emit("closed", this)
    }
    
    
  }
  
  /**
   * Close the handler
   *
   * @returns {Promise<void>}
   */
  async close(): Promise<void> {
    await this.flush()
      .onComplete(() => {
        this.closeImmediate()
      })
      .toPromise()
  }

  get queue() {
    return this.state.queue
  }

  get flushing() {
    return this.state.flushing
  }

  /**
   * Appends the log queue records to the file
   */
  private flush(): Future<boolean> {
    const { state } = this

    if (!this.#messageClient) {
      console.error("Service must be set in order to flush")
      return Future.ok(false)
    }


    if (state.flushing) {
      console.error("Flush in progress, only 1 flush runs at a time")
      state.flushContinue = state.queue.length > 0
      return Future.ok(false)
    }

    state.flushing = true
    return Future.do(async () => {
      try {
        const records = [...this.queue]
        this.queue.splice(0, this.queue.length)

        const msg:LogServerEventData = { clientId: this.#messageClient.clientId, records }
        this.#messageClient.sendEvent(msg)
        return true
      } catch (err) {
        console.error(`Failed to send log records`, err)
        return false
      } finally {
        state.flushing = false
        if (state.flushContinue) {
          state.flushContinue = false
          queueMicrotask(() => {
            this.flush()
          })
        }
      }
    })
  }

  /**
   * Handle log records, transform, push to ES
   *
   * @param record
   */
  append(record: LogRecord): void {
    const { queue, ready } = this.state
    if (!ready || !record) {
      console.error("Appender is not ready or record is null, can not append")
      return
    }

    try {
      const count = queue.length
      if (count > 999) {
        debug(`Too many log records (${count}) are in the queue, skipping %O`, record)
        return
      }
      // const plainObject = toPlainObject(record)
      // const data = this.config.prettyPrint ? JSONStringifyAny(plainObject, 2) : JSONStringifyAny(plainObject)
      const data = this.config.prettyPrint ? JSONStringifyAny(record, 2) : JSONStringifyAny(record)
      queue.push(data)
      this.flush()
    } catch (err) {
      console.warn(`Failed to synchronize `, err)
    }
  }

  /**
   *
   * @param messageClient
   * @param {Partial<LogServerClientAppenderOptions<Record>>} options
   */
  constructor(
    messageClient: UPM.IMessageClient<LogServerRequestMap>,
    options: LogServerClientAppenderOptions = {}
  ) {
    super()
    this.config = applyConfigDefaults(options)

    this.setMessageClient(messageClient)
  }
}
