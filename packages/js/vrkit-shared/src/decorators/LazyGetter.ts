
export function LazyGetter(
  ctor: any,
  propertyKey: string,
  descriptor: PropertyDescriptor
): PropertyDescriptor {
  let instance: any = undefined
  const get = (thiz: any) => {
    instance = descriptor.get.apply(thiz, [])
    return instance
  }
  return {
    ...descriptor,
    //value: undefined,
    get: function () {
      return instance ?? get(this)
    }
  }
}
