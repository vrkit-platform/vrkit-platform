import { assert, isPromise } from "@3fv/guard"
import { getLogger } from "@3fv/logger-proxy"
import { match } from "ts-pattern"
import { UPM } from "../UPMTypes"
import type { UtilityProcess } from "electron"

const log = getLogger(__filename)

export class UPMNodeProcess<
    MessageArgs extends UPM.MessageArgs = any,
    MessageType extends UPM.MessageArgNames<MessageArgs> = UPM.MessageArgNames<MessageArgs>
> {
  readonly processPort = process.parentPort
  
  private readonly clientPorts_ = new Map<string, Electron.MessagePortMain>()
  
  private readonly requestHandlers_ = new Map<MessageType, UPM.RequestHandler<MessageArgs, MessageType>>()
  
  private readonly eventHandlers_ = Array<UPM.EventHandler>()
  
  private onServiceClientPort(clientId: string, port: Electron.MessagePortMain) {
    assert(!this.clientPorts_.has(clientId), `port already registered for clientId(${clientId})`)
    
    port.on("message", (ev: Electron.MessageEvent) => {
      const {channel, payload} = ev.data as UPM.NodeEnvelope
      assert(channel === UPM.IPCChannel.UPMServiceMessage, `Only IPCChannel.UPMServiceMessage are allowed on client ports: ${channel}`)
      this.onServiceMessage(clientId, port, payload)
    })
    
    port.on("close", (ev: Electron.MessageEvent) => {
      this.clientPorts_.delete(clientId)
    })
  }
  
  private async onServiceMessage(clientId: string, port: UPM.Port, payload: UPM.Message<any,any>) {
    const {messageId, kind, data, type} = payload
    await match(kind)
        .with(UPM.MessageKind.Request, async () => {
          try {
            assert(
                this.requestHandlers_.has(type),
                `Unknown request handler (${type})`
            )
            
            const handler = this.requestHandlers_.get(type)
            const result = await handler(type, messageId, data)
            port.postMessage({
              type,
              kind: UPM.MessageKind.Response,
              messageId,
              data: result
            })
          } catch (err) {
            log.error(`Unable to handle message`, err)
            port.postMessage({
              type,
              kind: UPM.MessageKind.Response,
              messageId,
              data: null,
              error: err.message ?? err.toString()
            })
          }
        })
        .with(UPM.MessageKind.Event, async () => {
          try {
            for (const handler of this.eventHandlers_) {
              let res = handler(clientId, port, payload)
              if (isPromise(res)) {
                const resPromise = res as Promise<boolean>
                res = await resPromise
              }
              
              if (res === true) {
                log.info(`Successfully handled (${messageId}) event`)
                return;
              }
            }
            
          } catch (err) {
            log.error(`Unable to handle event (${messageId})`, err)
          }
        })
        .otherwise(async kind => {
          log.error(`Message kind (${kind}) is invalid here`)
        })
  }
  
  private onMessage(port: UPM.Port, message: Electron.MessageEvent) {
    log.info(`Message received on utilityProcess`, message)
    const {channel, payload} = message.data as UPM.NodeEnvelope
    match(channel)
        .with(UPM.IPCChannel.UPMServiceMessage, () => this.onServiceMessage("main", port, payload))
        .with(UPM.IPCChannel.UPMServiceNewClient, () => this.onServiceClientPort(payload.clientId, message.ports[0]))
        .run()
    
  }
  
  private constructor() {
    this.processPort.on("message", (message: Electron.MessageEvent) => this.onMessage(this.processPort, message))
  }
  
  addRequestHandler<Type extends MessageType>(type: Type, handler: UPM.RequestHandler<MessageArgs, Type>) {
    log.info(`Registering request handler for type (${type.toString()})`)
    this.requestHandlers_.set(type, handler)
  }
  
  addEventHandler(handler: UPM.EventHandler) {
    log.info(`Registering event handler`)
    this.eventHandlers_.push(handler)
  }
  
  /**
   * Singleton instance
   *
   * @private
   */
  private static sInstance_: UPMNodeProcess = null
  
  /**
   * Get singleton instance
   */
  static get(): UPMNodeProcess {
    if (!this.sInstance_) {
      this.sInstance_ = new UPMNodeProcess()
    }
    
    return this.sInstance_
  }
}

const upmNodeProcess = UPMNodeProcess.get()

export default upmNodeProcess