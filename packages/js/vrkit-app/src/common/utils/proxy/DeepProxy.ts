"use strict"

function parsePath(text) {
  return text.split(".")
}

function push(arr, el) {
  const newArr = arr.slice()
  newArr.push(el)
  return newArr
}

// names of the traps that can be registered with ES6's Proxy object
const trapNames = [
  "apply",
  "construct",
  "defineProperty",
  "deleteProperty",
  "enumerate",
  "get",
  "getOwnPropertyDescriptor",
  "getPrototypeOf",
  "has",
  "isExtensible",
  "ownKeys",
  "preventExtensions",
  "set",
  "setPrototypeOf"
]

// a list of parameter indexes that indicate that the a recieves a key at that parameter
// this information will be used to update the path accordingly
const keys = {
  get: 1,
  set: 1,
  deleteProperty: 1,
  has: 1,
  defineProperty: 1,
  getOwnPropertyDescriptor: 1
}

type DeepProxyTarget = {} | Function

type DeepProxyContext<T extends DeepProxyTarget> = {
  // target?: T
  nest(value?: any): object
  path: string[]
  rootTarget: T
}

export interface DeepProxyHandler<T extends object> {
  getPrototypeOf?(this: DeepProxyContext<T>, target: T): object | null
  setPrototypeOf?(this: DeepProxyContext<T>, target: T, v: any): boolean
  isExtensible?(this: DeepProxyContext<T>, target: T): boolean
  preventExtensions?(this: DeepProxyContext<T>, target: T): boolean
  getOwnPropertyDescriptor?(
    this: DeepProxyContext<T>,
    target: T,
    p: PropertyKey
  ): PropertyDescriptor | undefined
  has?(this: DeepProxyContext<T>, target: T, p: PropertyKey): boolean
  get?(this: DeepProxyContext<T>, target: T, p: PropertyKey, receiver: any): any
  set?(
    this: DeepProxyContext<T>,
    target: T,
    p: PropertyKey,
    value: any,
    receiver: any
  ): boolean
  deleteProperty?(this: DeepProxyContext<T>, target: T, p: PropertyKey): boolean
  defineProperty?(
    this: DeepProxyContext<T>,
    target: T,
    p: PropertyKey,
    attributes: PropertyDescriptor
  ): boolean
  enumerate?(this: DeepProxyContext<T>, target: T): PropertyKey[]
  ownKeys?(this: DeepProxyContext<T>, target: T): PropertyKey[]
  apply?(
    this: DeepProxyContext<T>,
    target: T,
    thisArg: any,
    argArray?: any
  ): any
  construct?(
    this: DeepProxyContext<T>,
    target: T,
    argArray: any,
    newTarget?: any
  ): object
}

// export interface DeepProxyContext<T extends object> {
//   nest(value?: any): object;
//   path: string[];
//   rootTarget: T;
// }

export interface DeepProxyOptions {
  path?: string[]
  userData?: { [key: string]: any }
}

export interface DeepProxyConstructor {
  //revocable<T extends object>(target: T, handler: DeepProxyHandler<T>): { proxy: T; revoke: () => void; };
  new <T extends object>(
    target: T,
    handler: DeepProxyHandler<T>,
    options?: DeepProxyOptions
  ): T
}

function DeepProxyInternal<T extends DeepProxyTarget>(
  rootTarget: T,
  traps: DeepProxyHandler<T>,
  options?: DeepProxyOptions
) {
  let path = []
  let userData = {}

  if (options !== undefined && typeof options.path !== "undefined") {
    path = parsePath(options.path)
  }
  if (options !== undefined && typeof options.userData !== "undefined") {
    userData = options.userData
  }

  function createProxy(target: T, path: string[]) {
    // avoid creating a new object between two traps
    const context = { rootTarget, path } as DeepProxyContext<T>
    Object.assign(context, userData)

    const realTraps = {}

    for (const trapName of trapNames) {
      const keyParamIdx = keys[trapName],
        trap = traps[trapName]

      if (typeof trap !== "undefined") {
        if (typeof keyParamIdx !== "undefined") {
          realTraps[trapName] = function () {
            const key = arguments[keyParamIdx]

            // update context for this trap
            context.nest = function (nestedTarget) {
              if (nestedTarget === undefined) nestedTarget = rootTarget
              return createProxy(nestedTarget, push(path, key))
            }

            return trap.apply(context, arguments)
          }
        } else {
          realTraps[trapName] = function () {
            // update context for this trap
            context.nest = function (nestedTarget) {
              if (nestedTarget === undefined) nestedTarget = {}
              return createProxy(nestedTarget, path)
            }

            return trap.apply(context, arguments)
          }
        }
      }
    }

    return new Proxy(target, realTraps)
  }

  return createProxy(rootTarget, path)
}

export const DeepProxy = DeepProxyInternal as unknown as DeepProxyConstructor

export default DeepProxy
