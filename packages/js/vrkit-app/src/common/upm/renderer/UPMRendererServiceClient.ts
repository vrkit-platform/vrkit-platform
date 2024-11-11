import { UPM } from "../UPMTypes"
import { Deferred } from "@3fv/deferred"
import { ipcRenderer } from "electron"
import { assert } from "@3fv/guard"

export class UPMRendererServiceClient<
    Args extends UPM.MessageArgs,
    MType extends UPM.MessageArgNames<Args> = UPM.MessageArgNames<Args>
> extends UPM.ServiceClient<Args, MType> {
  
  private readyDeferred_: Deferred<this> = null
  
  private port_: UPM.Port = null
  
  private async init(): Promise<this> {
    let deferred = this.readyDeferred_
    if (deferred) {
      return deferred.promise
    }
    deferred = this.readyDeferred_ = new Deferred()
    const onNewClient = (ev: Electron.IpcRendererEvent, serviceName: string, clientId: string) => {
      try {
        console.info(`Received new client & port for (service=${serviceName},clientId=${clientId})`)
        
        if (serviceName === this.serviceName && clientId === this.clientId) {
          console.info(`Matched client & service`)
          if (ev.ports.length > 0) {
            deferred.reject(Error("A least 1 port must be transferred"))
          } else {
            this.port_ = ev.ports[0]
            deferred.resolve(this)
          }
        }
      } catch (err) {
        console.error(`OnNewClient error`, err)
        deferred.reject(err)
      }
    }
    
    try {
      ipcRenderer.on(UPM.IPCChannel.UPMServiceNewClient, onNewClient)
      ipcRenderer.send(UPM.IPCChannel.UPMServiceNewClient,this.serviceName, this.clientId)
      
      await deferred.promise
      assert(!!this.port_, "Port should be valid after new client resolve")
    } catch (err) {
      deferred.reject(err)
      throw err
    } finally {
      ipcRenderer.off(UPM.IPCChannel.UPMServiceNewClient, onNewClient)
    }
    
    return this
  }
  
  constructor(readonly serviceName: string, readonly clientId: string) {
    super()
  }
  
  close():void {
  }
  
  async executeRequest<Type extends MType, R = any>(
      type:Type,
      data:UPM.MessageArgData<Args, Type>
  ):Promise<R> {
    return null
  }
  
  sendEvent(data:any):void {
  }
  
  whenReady():Promise<this> {
    return this.readyDeferred_.promise
  }
  
}

export default UPMRendererServiceClient