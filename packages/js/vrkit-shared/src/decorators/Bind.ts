export function Bind<A>(
  target: A,
  propertyKey: string,
  descriptor: PropertyDescriptor
) {
  const fn = descriptor.value

  return {
    configurable: true,
    get() {
      return fn.bind(this)
    }
  }
}
