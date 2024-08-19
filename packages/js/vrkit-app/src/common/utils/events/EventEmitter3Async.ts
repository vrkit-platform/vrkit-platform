
import EventEmitter3 from "eventemitter3"
import { isPromise } from "@3fv/guard"

declare module "eventemitter3" {
  namespace EventEmitter {
    export interface ListenerFn<Args extends any[] = any[]> {
      (...args:Args): any;
    }
  }
}

export class EventEmitter3Async<
  EventTypes extends object,
  Context extends any = any
  > extends EventEmitter3<EventTypes, Context> {
  
  constructor() {
    super()
  }
  
  /**
   * Emit async
   *
   * @param event
   * @param args
   */
  async emitAsync<
    EventName extends EventEmitter3.EventNames<
      EventTypes
      >
    >(
    event: EventName,
    ...args: EventEmitter3.EventArgs<
      EventTypes,
      EventName
      >
  ) {
    const listeners = this.listeners(event),
      promises = listeners
        .map(listener => listener(...args))
        .map(result => (isPromise(result) ? result : Promise.resolve(result))),
      results = await Promise.all(promises)
    
    return results
  }
}