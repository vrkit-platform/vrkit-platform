import { assign, defaults } from "lodash"
import type { Appender, LogRecord } from "@3fv/logger-proxy"
import { Future } from "@3fv/prelude-ts"
import { Buffer } from "buffer"
import Debug from "debug"
import { UtilityProcess } from "electron"
import { match } from "ts-pattern"
import { UPM } from "../upm/UPMTypes"


const debug = Debug("vrkit:UPMLogServerClientAppender")

const getDefaultConfig = (): MainLogAppenderConfig => ({
  prettyPrint: false
})

function applyConfigDefaults(options: MainLogAppenderOptions): MainLogAppenderConfig {
  return defaults(options, getDefaultConfig())
}

export interface MainLogAppenderConfig<Record extends LogRecord = any> {
  prettyPrint: boolean
}

export type MainLogAppenderOptions<Record extends LogRecord = any> = Partial<MainLogAppenderConfig<Record>>

export class MainLogAppender<Record extends LogRecord> implements Appender<Record> {
  readonly config: MainLogAppenderConfig<Record>

  private readonly state: {
    flushing: boolean
    queue: Array<Buffer>
    ready: boolean
    error?: Error
  } = {
    ready: false,
    flushing: false,
    queue: []
  }

  isReady() {
    return this.state.ready
  }

  /**
   * Initialize and setup the appender
   *
   * @returns {MainLogAppender<Record>}
   */
  setup(): MainLogAppender<Record> {
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
        this.service.close()
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
    const { state, service } = this

    if (!service) {
      console.error("Service must be set in order to flush")
      return Future.ok(false)
    }

    state.flushing = true
    return Future.do(async () => {
      try {
        const buffers = [...this.queue]
        this.queue.splice(0, this.queue.length)
        
        service.sendEvent({buffers})
        return true
      } catch (err) {
        console.error(`Failed to send log records`, err)
        return false
      } finally {
        this.state.flushing = false
      }
    })
  }

  /**
   * Handle log records, transform, push to ES
   *
   * @param record
   */
  append(record: Record): void {
    try {
      const { queue } = this.state
      const count = queue.length
      if (count > 999) {
        debug(`Too many log records (${count}) are in the queue, skipping %O`, record)
        return
      }

      const data = this.config.prettyPrint ? JSON.stringify(record, null, 2) : JSON.stringify(record)
      queue.push(Buffer.from(data + "\n", "utf-8"))
      this.flush()
    } catch (err) {
      console.warn(`Failed to synchronize `, err)
    }
  }

  /**
   *
   * @param service
   * @param {Partial<MainLogAppenderOptions<Record>>} options
   */
  constructor(
    readonly service: UPM.ServiceClient<any,any>,
    options: Partial<MainLogAppenderOptions<Record>> = {}
  ) {
    this.config = applyConfigDefaults(options)

    this.setup()
  }
}
