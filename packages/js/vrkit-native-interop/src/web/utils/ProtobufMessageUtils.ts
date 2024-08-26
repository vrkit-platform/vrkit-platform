import type { IMessageType } from "@protobuf-ts/runtime"


/**
 * Get instance type from message ctor
 */
export type MessageTypeFromCtor<M> = (M extends IMessageType<infer T> ? T : never)
