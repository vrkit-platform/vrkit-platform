import { get as _get, bind as _bind } from "lodash"

export function invokeProp<
  T extends {},
  K extends keyof T,
  Fn extends T[K] extends (...args: any[]) => any ? T[K] : never,
  Params extends Parameters<Fn>,
  R extends ReturnType<Fn>
>(prop?: K, ...args: Params): (o: T) => R {
  return o => (_get(o, prop) as Fn).call(o, ...args)
}

export function invoke<Args extends any[]>(...args: Args) {
  return <Fn extends (...Args) => any>(fn: Fn) => fn(...args) as ReturnType<Fn>
}
