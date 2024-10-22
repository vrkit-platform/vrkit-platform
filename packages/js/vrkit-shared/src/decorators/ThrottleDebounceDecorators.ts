import {debounce, throttle, DebounceSettings, ThrottleSettings } from 'lodash'


export function Throttle(wait:number = 0, options: ThrottleSettings = {}): MethodDecorator {
  return (proto: unknown, name: string | symbol, descriptor: PropertyDescriptor) => {
    if (!descriptor || typeof descriptor.value !== 'function') {
      throw new Error('debounce can only decorate functions')
    }
    const fn = descriptor.value
    descriptor.value = throttle(fn, wait, options)
    Object.defineProperty(proto, name, descriptor)
  }
}

export function Debounce(wait:number = 0, opts: DebounceSettings = {}): MethodDecorator {
  return (proto: unknown, name: string | symbol, descriptor: PropertyDescriptor) => {
    if (!descriptor || typeof descriptor.value !== 'function') {
      throw new Error('debounce can only decorate functions')
    }
    const fn = descriptor.value
    descriptor.value = debounce(fn, wait, opts)
    Object.defineProperty(proto, name, descriptor)
  }
}