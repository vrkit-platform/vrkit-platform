export type AnyDecorator =
  | ClassDecorator
  | MethodDecorator
  | PropertyDecorator

export type AnyDecorators<
  D extends AnyDecorator = AnyDecorator
> = Array<D>
