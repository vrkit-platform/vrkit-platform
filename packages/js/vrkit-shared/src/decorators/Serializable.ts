import { primitive, PropDef, serializable } from "serializr"
import { applyDecorators } from "./applyDecorators"

export function Serializable(
  propSchema?: PropDef,
  ...extraDecorators: PropertyDecorator[]
) {
  if (!propSchema) {
    propSchema = primitive()
  }
  return applyDecorators(
    serializable(propSchema),
    ...extraDecorators
  )
}
