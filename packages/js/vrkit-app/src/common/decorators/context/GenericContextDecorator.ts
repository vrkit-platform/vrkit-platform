import type {
  AnyDecorator,
  AnyDecorators
} from "../AnyDecorator"
import type { GenericDecoratorContext } from "./GenericDecoratorContext"

export type GenericContextDecorator = (
  ctx: GenericDecoratorContext
) => AnyDecorators | AnyDecorator
