import * as Serializers from "serializr"

export interface GenericDecoratorContext {
  Serializers: typeof Serializers
}

export function getGenericDecoratorContext(): GenericDecoratorContext {
  return {
    Serializers
  }
}
