import { assert, EnumValueMap } from "./ObjectUtil"
import { isString } from "@3fv/guard"

export function EnumValueToName<E extends EnumValueMap<any>>(enumType: E, value: string | number): string {
  if (isString(value)) {
    return value
  }
  
  const name = enumType[value]
  assert(isString(name), "Unable to find enum name for value")
  return name
}
