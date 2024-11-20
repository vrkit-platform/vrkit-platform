import { Attribute, AttributeOptions } from "./Attribute"


export function EnumAttribute(
  enumObject: Record<string, string> | readonly string[],
  enumName: string,
  overrideOptions?: AttributeOptions
) {
  return Attribute(
    {
      enum: enumObject,
      enumName
    },
    overrideOptions
  )
}
