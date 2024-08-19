import { AnyFn } from "../fp/Lifters"

export type Once<F extends AnyFn> = F & {
  clear(): void
}

export type OnceCleaner<F extends AnyFn> = (o: ReturnType<F>, fn: F) => void

export function once<F extends (...args: any[]) => any>(fn: F, cleaner?: OnceCleaner<F>): F {
  let invoked: boolean = false
  let result: ReturnType<F> = undefined

  // WRAPPER
  const wrapper = ((...args: Parameters<F>) => {
    if (invoked) {
      return result
    } else {
      invoked = true
      result = fn(...args)
      return result
    }
  }) as Once<F>

  // ADD THE CLEAR METHOD
  wrapper.clear = () => {
    if (invoked) {
      if (cleaner) {
        cleaner(result, fn)
      }

      invoked = false
      result = undefined
    }
  }

  return wrapper
}


