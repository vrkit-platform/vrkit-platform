import { assert, isFunction } from "@3fv/guard"

export const Once = () =>
  ((
    target: any,
    propertyKey?: string | symbol,
    descriptor?: TypedPropertyDescriptor<any>
  ) => {
    const fn = descriptor.value
    if (!isFunction(fn)) {
      throw Error(`Once can only be applied to a method`)
    }

    let result: any = undefined
    let resultError: any = undefined
    let invoked = false
    const onceFn = function(...args:any[]) {
      if (!invoked) {
        invoked = true
        try {
          result = fn.apply(this, args)
        } catch (err) {
          resultError = err
        }
      }

      if (resultError) {
        throw resultError
      }

      return result
    }

    return {
      // ...descriptor,
      configurable: true,
      get() {
        return onceFn.bind(this)
      },
      // value(...args: any[]) {
      //   return onceFn.apply(this, args)
      // }
    }
  }) as MethodDecorator
