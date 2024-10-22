import { isFunction } from "@3fv/guard"

export function invokeWithProducer<
  P extends () => any,
  T extends ReturnType<P>,
  Fn extends (value: T) => any
>(producer: P, fn: Fn): ReturnType<Fn> {
  return fn(producer())
}

export function invokeWith<T, Fn extends (value: T) => any>(
  value: T,
  fn: Fn
): ReturnType<Fn> {
  return fn(value)
}

export const pipe = invokeWith

