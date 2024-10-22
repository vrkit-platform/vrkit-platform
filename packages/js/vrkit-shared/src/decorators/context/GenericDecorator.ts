export type GenericDecorator = <
  TFunction extends Function,
  Y
>(
  target: object | TFunction,
  propertyKey?: string | symbol,
  descriptor?: TypedPropertyDescriptor<Y>
) => void

export type GenericDecorators = GenericDecorator[]
