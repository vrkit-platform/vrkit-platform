export function Bind<A>(
  target: A,
  propertyKey: string,
  descriptor: PropertyDescriptor
) {
  const fn = descriptor.value

  // Object.assign(descriptor,{
  //   configurable: true,
  //   value: function (...args) {
  //     return fn.apply(this,args)
  //   }
  // })
  return {
    configurable: true,
    get() {
      return fn.bind(this)
    }
  }
}
