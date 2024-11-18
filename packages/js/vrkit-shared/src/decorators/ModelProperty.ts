import type { DecoratorSchema } from "class-validator-jsonschema/build/decorators"
import { decorateWithNodeContext } from "./decorateWithNodeContext"

export function ModelProperty(
  schema: DecoratorSchema = {},
  ...extraDecorators: PropertyDecorator[]
): PropertyDecorator {
  return decorateWithNodeContext(
    ({ JSONSchema }) => [
      JSONSchema(schema),
      ...extraDecorators
    ]
  )
}

// export function HideModelProperty(): PropertyDecorator {
//   return decorateWithNodeContext(({ ApiHideProperty }) =>
//     ApiHideProperty()
//   )
// }
