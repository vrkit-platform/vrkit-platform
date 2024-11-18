import { ClassConstructor, isFunction } from "@3fv/guard"
import type { MessageType } from "@protobuf-ts/runtime"

export interface ClassConstructorWithPartial<T extends {}> extends ClassConstructor<T> {
  new (from?: Partial<T>): T
}

export type MessageTypeClassConstructor<T extends {}> = MessageType<T>

export const MessageTypeCtorFns = Array<keyof MessageType<any>>("create", "fromJson", "toJson")

export function isMessageTypeClassConstructor<T extends {}>(ctor:any): ctor is MessageTypeClassConstructor<T> {
  return MessageTypeCtorFns.every(m => isFunction(ctor?.[m]))
}