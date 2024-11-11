import type { UtilityProcess } from "electron"
import { isFunction } from "@3fv/guard"
export namespace UPM {
  export enum MessageKind {
    Event = "Event",
    Request = "Request",
    Response = "Response"
  }
  
  export enum IPCChannel {
    UPMServiceMessage = "UPMServiceMessage",
    UPMServiceNewClient = "UPMServiceNewClient"
  }
  
  export enum NodeMessageType {
    UPMNodeEventMessage = "UPMNodeEventMessage",
    UPMNodeRequestResponse = "UPMNodeRequestResponseMessage",
  }
  
  export type MessageArgs = {}
  
  export type MessageArgNames<Args extends MessageArgs> = keyof Args
  export type MessageArgData<Args extends MessageArgs, Name extends MessageArgNames<Args>> = Args[Name]
  
  export interface Message<
      Args extends MessageArgs = any,
      Type extends MessageArgNames<Args> = MessageArgNames<Args>
  > {
    type: Type;
    kind: MessageKind;
    messageId: number;
    data: MessageArgData<Args,Type>;
    error?: string
  }
  
  export interface NodeEnvelope<Payload extends {} = any> {
    channel: IPCChannel
    payload: Payload
  }
  
  export type RequestHandler<
      Args extends MessageArgs = any,
      Type extends MessageArgNames<Args> = MessageArgNames<Args>,
      R = any
  > = (type: Type, messageId: number, data: Args[Type]) => Promise<R>
  
  
  
  export type NodeMessage<
      Args extends MessageArgs = any,
      Type extends MessageArgNames<Args> = MessageArgNames<Args>> = NodeEnvelope<Message<Args,Type>>
  
  /**
   * @returns true if payload was handled, false if not
   */
  export type EventHandler = (clientId: string, port: UPM.Port, payload: any) => boolean
  
  export function isMessagePort(port: UPM.Port): port is Electron.MessagePortMain {
    return isFunction(port?.["close"])
  }
  
  export function isUtilityProcess(port: UPM.Port): port is UtilityProcess {
    return !!port && !isMessagePort(port)
  }
  
  export type Port = MessagePort | Electron.MessagePortMain | Electron.ParentPort | UtilityProcess
  
  export abstract class ServiceClient<
      Args extends MessageArgs,
      MType extends MessageArgNames<Args> = UPM.MessageArgNames<Args>
  > {
    abstract sendEvent(data: any):void
    abstract executeRequest<Type extends MType, R = any>(
        type: Type,
        data: MessageArgData<Args, Type>
    ): Promise<R>
    
    abstract close():void
    
    abstract whenReady(): Promise<this>
  }
}