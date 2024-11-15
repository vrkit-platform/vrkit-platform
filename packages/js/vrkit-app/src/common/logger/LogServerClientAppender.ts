import type { Appender, LogRecord } from "@3fv/logger-proxy"
import type { UPM } from "@3fv/electron-utility-process-manager"
import type { LogServerEventData, LogServerRequestMap } from "./LogServerTypes"
import { assign, defaults } from "lodash"
import { Future } from "@3fv/prelude-ts"
import Debug from "debug"



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

export class LogServerClientAppender implements Appender {
  readonly config: LogServerClientAppenderConfig

  private readonly state: {
    flushing: boolean
    flushContinue: boolean
    queue: Array<string>
    ready: boolean
    destroyed: boolean
    error?: Error
  } = {
    ready: false,
    flushing: false,
    flushContinue: false,
    destroyed: false,
    queue: []
  }

  isReady() {
    return this.state.ready
  }

  /**
   * Initialize and setup the appender
   *
   * @returns {LogServerClientAppender<Record>}
   */
  setup(): LogServerClientAppender {
    const { state } = this
    if (!!state.ready) {
      return this
    }

    try {
      assign(state, {
        ready: true
      })

      return this
    } catch (err) {
      assign(state, {
        error: err,
        ready: false
      })
      throw err
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
        this.messageClient.close()
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
    const { state, messageClient } = this

    if (!messageClient) {
      console.error("Service must be set in order to flush")
      return Future.ok(false)
    }

    if (state.destroyed) {
      console.error("Appender is destroyed, can not flush")
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

        const msg:LogServerEventData = { clientId: this.messageClient.clientId, records }
        messageClient.sendEvent(msg)
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
    const { destroyed, queue } = this.state
    if (destroyed || !record) {
      console.error("Appender is destroyed or record is null, can not append")
      return
    }

    try {
      const count = queue.length
      if (count > 999) {
        debug(`Too many log records (${count}) are in the queue, skipping %O`, record)
        return
      }

      const data = this.config.prettyPrint ? JSON.stringify(record, null, 2) : JSON.stringify(record)
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
    readonly messageClient: UPM.IMessageClient<LogServerRequestMap>,
    options: LogServerClientAppenderOptions = {}
  ) {
    this.config = applyConfigDefaults(options)

    this.setup()
  }
}
