import { Attribute, AttributeOptions } from "./Attribute"
import { raw } from "serializr"

export function AnyAttribute(
  overrideOptions?: AttributeOptions
) {
  return Attribute({
    serial: raw(),
    ...overrideOptions
  })
}
