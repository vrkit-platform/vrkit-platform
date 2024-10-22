import { EventEmitter } from "events"
import { generateId } from "../IdUtil"
import { isString } from "@3fv/guard"

export interface DataEvent<
  Type extends string | symbol,
  Data extends object
> {
  id: string
  type: Type
  data: Data
}

export class DataEventBase<
  Type extends string | symbol,
  Data extends object
> implements DataEvent<Type, Data>
{
  id = generateId()

  constructor(public type: Type, public data: Data) {}
}

export type DataEventHandler<
  Type extends string,
  Data extends object
> = (event: DataEvent<Type, Data>) => any

export class DataEventEmitter<Type extends string> {
  private emitter = new EventEmitter()

  constructor() {}

  emit<Data extends object>(type: Type, data: Data)
  emit<Data extends object>(event: DataEvent<Type, Data>)
  emit<Data extends object>(
    typeOrEvent: Type | DataEvent<Type, Data>,
    data?: Data
  ) {
    const type = isString(typeOrEvent)
        ? typeOrEvent
        : typeOrEvent.type,
      event = isString(typeOrEvent)
        ? new DataEventBase(type, data)
        : typeOrEvent

    this.emitter.emit(type, event)
  }

  on<Data extends object>(
    type: Type,
    handler: DataEventHandler<Type, Data>
  ) {
    this.emitter.on(type, handler)
  }

  off<Data extends object>(
    type: Type,
    handler: DataEventHandler<Type, Data>
  ) {
    this.emitter.off(type, handler)
  }

  once<Data extends object>(
    type: Type,
    handler: DataEventHandler<Type, Data>
  ) {
    this.emitter.once(type, handler)
  }
}
