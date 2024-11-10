import { app, MessageChannelMain, MessagePortMain, utilityProcess, UtilityProcess } from "electron"
import { getLogger } from "@3fv/logger-proxy"
import { assert, getValue, isString } from "@3fv/guard"
import { Bind, isNotEmpty } from "vrkit-shared"
import Fsx from "fs-extra"
import { Deferred } from "@3fv/deferred"
import Path from "path"
import { Future } from "@3fv/prelude-ts"
import { UPM } from "../../../common/UtilityProcessManagerTypes"

const log = getLogger(__filename)

const DefaultUtilityProcessRequestTimeout = 120000

interface PendingMessage<MessageType extends string = any, T = any> {
  type: MessageType
  deferred: Deferred<T>
  timeoutId: ReturnType<typeof setTimeout>
  messageId: number
}

export interface UtilityProcessContainerConfig {
  serviceName: string
}

export type UtilityProcessContainerOptions = Partial<UtilityProcessContainerConfig>

export class UtilityProcessContainer {
  private readonly config_: UtilityProcessContainerConfig

  private readyDeferred_: Deferred<UtilityProcessContainer> = null
  private killDeferred_: Deferred<number> = null
  private lastMessageId_ = 0

  private process_: UtilityProcess = null

  private pendingMessages_ = new Map<number, PendingMessage>()

  private messageChannels_ = new Map<string, MessageChannelMain>()

  private async init(): Promise<UtilityProcessContainer> {
    let deferred = this.readyDeferred_
    if (deferred) return deferred.promise
    deferred = this.readyDeferred_ = new Deferred()

    try {
      const exitListener = (code: number) => {
        if (code !== 0) {
          deferred.reject(new Error(`process exited with code ${code} upon starting`))
        }
      }
      const spawnListener = async () => {
        this.process_.off("exit", exitListener)
        this.process_.on("message", this.onMessage.bind(this))
        deferred.resolve(this)
      }

      this.process_ = utilityProcess
        .fork(this.entryFile, [], {
          serviceName: this.config_.serviceName,
          env: {
            ...process.env,
            IN_CHILD_PROCESS: "true",
            APP_NAME: app.name
          }
        })
        .on("spawn", spawnListener)
        .on("exit", exitListener)
      
      await deferred.promise
      return this
    } catch (err) {
      deferred.reject(err)
    }
  }

  @Bind
  private onMessage(payload: {
    type: string
    messageId: number
    data: any
    error?: string
  }) {
    const {
      type,
      messageId,
      data,
      error
    } = payload
    // if (message !== originalMessage || messageId !== originalMessageId) {
    //   return
    // }
    try {
      const pending = this.pendingMessages_.get(messageId)
      if (!pending) {
        log.info(`Unable to find pending record ${messageId}`)
        return
      }

      if (!pending.deferred.isSettled()) {
        log.error(`Already settled record ${messageId}`)
        return
      }

      pending.deferred.resolve(data)

      this.removePendingMessage(messageId)
      if (typeof error !== "undefined") {
        log.error(error)
        pending.deferred.reject(new Error(error))
        return
      }
      pending.deferred.resolve(data)
    } catch (err) {
      log.error(`Failed to handle message`, err)
    }
  }

  whenReady() {
    return this.readyDeferred_.promise
  }
  
  /**
   * Returned client side port (for Renderer)
   * @param clientId
   */
  async createMessageChannel(clientId: string): Promise<MessagePortMain> {
    await this.whenReady()
    const channel = new MessageChannelMain(),
      { port1, port2 } = channel

    this.messageChannels_.set(clientId, channel)
    try {
      port2.on("message", this.onMessage.bind(this))
      port2.on("close", () => this.onPortClose(clientId, channel))
      port2.start()

      this.process_.postMessage({ type: UPM.IPCChannels.ClientPort, clientId }, [port1])
    } catch (err) {
      log.error(`Unable to create channel id=${clientId}`, err)
      this.closeMessageChannel(clientId, channel)
    }
    return port2
  }
  
  private onPortClose(id: string, channel: MessageChannelMain) {
    log.info(`main side of message channel(id=${id}) closed`)
    this.closeMessageChannel(id,channel)
  }

  private closeMessageChannel(id: string, channel: MessageChannelMain) {
    if (this.messageChannels_.has(id)) this.messageChannels_.delete(id)

    getValue(() => channel.port1.close())
    getValue(() => channel.port2.close())
    channel.removeAllListeners()
  }

  async executeRequest<MessageType extends string, T>(
    type: MessageType,
    data: T,
    port: MessagePort | UtilityProcess = this.process_,
    timeout: number = DefaultUtilityProcessRequestTimeout
  ): Promise<any> {
    const messageId = this.generateMessageId(),
      pending: PendingMessage = {
        deferred: new Deferred(),
        type,
        messageId,
        timeoutId: setTimeout(() => this.removePendingMessage(messageId), timeout)
      }
    this.pendingMessages_.set(messageId, pending)
    this.sendMessage<MessageType, T>(messageId, type, data, port)

    try {
      const result = await pending.deferred.promise
      log.debug(`Completed utility request (messageId=${messageId})`)
      return result
    } catch (err) {
      log.error(`Failed utility request (messageId=${messageId})`, err)
      throw err
    }
  }

  async stop(): Promise<void> {
    await this.killProcess()
  }

  private sendMessage<MessageType extends string, T>(
    messageId: number,
    type: MessageType,
    data: T,
    port: MessagePort | UtilityProcess = this.process_
  ): number {
    assert(!!this.process_, "The process is not running")

    const payload = { type, messageId, data }

    port.postMessage(payload)

    return messageId
  }

  private async killProcess(): Promise<number> {
    if (!this.readyDeferred_)
      return
    
    let killDeferred = this.killDeferred_
    if (killDeferred)
      return killDeferred.promise
    
    if (!this.readyDeferred_.isSettled())
      await this.readyDeferred_.promise.catch(err => log.error(`ignoring error`, err))
      
    const process = this.process_
    if(!process) {
      log.error("The process is not running")
      return 0
    }

    this.cancelAllPendingMessages()
    this.removeAllMessageChannels()
    killDeferred = this.killDeferred_ = new Deferred<number>()
    try {
      process.once("exit", (code: number) => {
        if (code !== 0) {
          log.error(`Process exited with code ${code} upon stopping`)
        }
        killDeferred.resolve(code)
      })
      process.kill()
    } catch (err) {
      log.error("Unable to kill utility process", err)
      killDeferred.reject(err)
    }

    return await killDeferred.promise
  }

  private removeAllMessageChannels() {
    for (const [id, channel] of [...this.messageChannels_.entries()]) {
      this.closeMessageChannel(id, channel)
    }
  }

  private cancelAllPendingMessages(): void {
    for (const key of [...this.pendingMessages_.keys()]) {
      this.removePendingMessage(key)
    }
  }

  constructor(
    readonly utilityProcessId: string,
    readonly entryFile: string,
    options: UtilityProcessContainerOptions = {}
  ) {
    assert(
      isString(entryFile) && isNotEmpty(entryFile) && Fsx.existsSync(entryFile),
      `entry file must be provided (${entryFile})`
    )

    this.config_ = {
      serviceName: utilityProcessId,
      ...options
    }
    
    this.init()
        .catch(err => {
          log.error(`Failed to init utility process`, err)
        })
  }

  private removePendingMessage(messageId: number): void {
    const pending = this.pendingMessages_.get(messageId)
    if (!pending) return
    clearTimeout(pending.timeoutId)
    if (!pending.deferred.isSettled()) {
      pending.deferred.reject("The pending message is being removed before promise is settled")
    }
    this.pendingMessages_.delete(messageId)
  }

  private generateMessageId(): number {
    return this.lastMessageId_++
  }
  
  async [Symbol.asyncDispose]() {
    await this.stop()
  }
}


export class UtilityProcessManager {
  private processes_ =  new Map<string, UtilityProcessContainer>()
  
  private onNewClient(ev: Electron.IpcMainEvent, utilityProcessId: string, clientId: string) {
    const sender = ev.sender
    if (!sender) {
      log.error(`sender is invalid on new client ipc message`, ev)
      return
    }
    
    const proc = this.getProcess(utilityProcessId)
    if (!proc) {
      log.error(`no proc found for ${utilityProcessId}`, ev)
      return
    }
    
    Future.do(async () => {
      const clientPort = await proc.createMessageChannel(clientId)
      log.info(`Received client port for proc (id=${utilityProcessId},clientId=${clientId})`)
      sender.postMessage(UPM.IPCChannels.ClientPort,null, [clientPort])
      
    })
  }

  private async destroy() {
    for (const [id] of [...this.processes_.keys()]) {
      await this.stopProcess(id)
    }
  }
  
  getProcess(id: string) {
    return this.processes_.has(id) ? this.processes_.get(id) : null
  }
  
  async createProcess(id: string, entryFile: string) {
    assert(!this.processes_.has(id), `utility process with id (${id}) is already registered`)
    const proc = new UtilityProcessContainer(id, entryFile, {
      serviceName: id
    })
    
    this.processes_.set(id, proc)
    try {
      await proc.whenReady()
    } catch (err) {
      await this.stopProcess(id)
    }
  }
  
  async stopProcess(id: string) {
    if (!this.processes_.has(id))
      return
    
    const proc = this.processes_.get(id)
    await proc.stop()
  }

  async [Symbol.asyncDispose]() {
    await this.destroy()
  }

  private constructor() {}

  /**
   * Singleton instance
   *
   * @private
   */
  private static sInstance_: UtilityProcessManager = null

  /**
   * Get singleton instance
   */
  static get(): UtilityProcessManager {
    if (!this.sInstance_) {
      this.sInstance_ = new UtilityProcessManager()
    }

    return this.sInstance_
  }
}

export default UtilityProcessManager
