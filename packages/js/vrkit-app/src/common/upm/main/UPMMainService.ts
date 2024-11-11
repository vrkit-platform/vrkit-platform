import { app, MessageChannelMain, MessagePortMain, utilityProcess, UtilityProcess } from "electron"
import { getLogger } from "@3fv/logger-proxy"
import { assert, getValue, isString } from "@3fv/guard"
import { Bind, isNotEmpty } from "vrkit-shared"
import Fsx from "fs-extra"
import { Deferred } from "@3fv/deferred"
import { UPM } from "../UPMTypes"
import MessageKind = UPM.MessageKind

const log = getLogger(__filename)

const DefaultUtilityProcessRequestTimeout = 120000

interface PendingRequestMessage<
    Args extends UPM.MessageArgs = any,
    Type extends UPM.MessageArgNames<Args> = UPM.MessageArgNames<Args>,
    R = any
> {
  deferred: Deferred<R>

  timeoutId: ReturnType<typeof setTimeout>

  messageId: number
}

export interface UPMMainServiceConfig {}

export type UPMMainServiceOptions = Partial<UPMMainServiceConfig>

export class UPMMainService<
  MessageArgs extends UPM.MessageArgs,
  MessageType extends UPM.MessageArgNames<MessageArgs> = UPM.MessageArgNames<MessageArgs>
> extends UPM.ServiceClient<MessageArgs, MessageType> {
  private readonly config_: UPMMainServiceConfig

  private readyDeferred_: Deferred<this> = null

  private killDeferred_: Deferred<number> = null

  private lastMessageId_ = 0

  private childProcess_: UtilityProcess = null

  private pendingMessages_ = new Map<number, PendingRequestMessage>()

  private messageChannels_ = new Map<string, MessageChannelMain>()

  private async init(): Promise<UPMMainService<MessageArgs, MessageType>> {
    let deferred = this.readyDeferred_
    if (deferred) {
      return deferred.promise
    }
    deferred = this.readyDeferred_ = new Deferred()

    try {
      const exitListener = (code: number) => {
        if (code !== 0) {
          deferred.reject(new Error(`process exited with code ${code} upon starting`))
        }
      }
      const spawnListener = async () => {
        this.childProcess_.off("exit", exitListener)
        this.childProcess_.on("message", this.onMessage.bind(this))
        deferred.resolve(this)
      }

      this.childProcess_ = utilityProcess
        .fork(this.entryFile, [], {
          serviceName: this.serviceName,
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
  private onMessage<Type extends MessageType = any>(payload: UPM.Message<MessageArgs, Type>) {
    const { type, kind, messageId, data, error } = payload

    try {
      const pending = this.pendingMessages_.get(messageId)
      if (!pending) {
        log.info(`Unable to find pending record ${messageId}`)
        return
      }

      if (pending.deferred.isSettled()) {
        log.error(`Already settled record ${messageId}`)
        return
      }

      this.removePendingMessage(messageId)
      if (!!error) {
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
  createMessageChannel(clientId: string): MessagePortMain {
    assert(
      this.readyDeferred_?.isFulfilled() ?? false,
      `Service (${this.serviceName}) is not fulfilled or has an error (${this.readyDeferred_.status()})`
    )
    const channel = new MessageChannelMain(),
      { port1, port2 } = channel

    this.messageChannels_.set(clientId, channel)
    try {
      // port2.on("message", this.onMessage.bind(this))
      // port2.on("close", () => this.onPortClose(clientId, channel))
      // port2.start()

      this.childProcess_.postMessage(
        {
          message: {
            channel: UPM.IPCChannel.UPMServiceNewClient,
            payload: { clientId }
          }
        },
        [port1]
      )
    } catch (err) {
      log.error(`Unable to create channel id=${clientId}`, err)
      this.closeMessageChannel(clientId, channel)
      throw err
    }
    return port2
  }

  private onPortClose(id: string, channel: MessageChannelMain) {
    log.info(`main side of message channel(id=${id}) closed`)
    this.closeMessageChannel(id, channel)
  }

  private closeMessageChannel(id: string, channel: MessageChannelMain) {
    if (this.messageChannels_.has(id)) {
      this.messageChannels_.delete(id)
    }

    getValue(() => channel.port1.close())
    getValue(() => channel.port2.close())
    channel.removeAllListeners()
  }

  close(): void {
    log.warn("Close has no effect when called via the main process")
  }

  /**
   * Send an event as `fire-and-forget`
   *
   * @param data
   * @param port
   */
  sendEvent(data: any, port: UPM.Port = this.childProcess_): void {
    const messageId = this.generateMessageId()
    const payload: UPM.NodeEnvelope = {
      channel: UPM.IPCChannel.UPMServiceMessage,
      payload: { messageId, data, kind: MessageKind.Event }
    }

    port.postMessage(payload)
  }

  /**
   * Send request
   *
   * @param type
   * @param data
   * @param port
   * @param timeout
   */
  async executeRequest<Type extends MessageType, R = any>(
    type: Type,
    data: UPM.MessageArgData<MessageArgs, Type>,
    port: MessagePort | UtilityProcess = this.childProcess_,
    timeout: number = DefaultUtilityProcessRequestTimeout
  ): Promise<R> {
    assert(!!this.childProcess_, "The process is not running")
    const messageId = this.generateMessageId(),
      pending: PendingRequestMessage<MessageArgs, Type, R> = {
        deferred: new Deferred<R>(),
        messageId,
        timeoutId: setTimeout(() => this.removePendingMessage(messageId), timeout)
      }

    this.pendingMessages_.set(messageId, pending)
    const payload: UPM.NodeMessage<MessageArgs, Type> = {
      channel: UPM.IPCChannel.UPMServiceMessage,
      payload: { type, messageId, data, kind: MessageKind.Request }
    }

    port.postMessage(payload)

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
    await this.kill()
  }

  private async kill(): Promise<number> {
    if (!this.readyDeferred_) {
      return
    }

    let killDeferred = this.killDeferred_
    if (killDeferred) {
      return killDeferred.promise
    }

    if (!this.readyDeferred_.isSettled()) {
      await this.readyDeferred_.promise.catch(err => log.error(`ignoring error`, err))
    }

    const process = this.childProcess_
    if (!process) {
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
    readonly serviceName: string,
    readonly entryFile: string,
    options: UPMMainServiceOptions = {}
  ) {
    super()
    assert(
      isString(entryFile) && isNotEmpty(entryFile) && Fsx.existsSync(entryFile),
      `entry file must be provided (${entryFile})`
    )

    this.config_ = {
      ...options
    }

    this.init().catch(err => {
      log.error(`Failed to init utility process`, err)
    })
  }

  private removePendingMessage(messageId: number): void {
    const pending = this.pendingMessages_.get(messageId)
    if (!pending) {
      return
    }
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

export default UPMMainService