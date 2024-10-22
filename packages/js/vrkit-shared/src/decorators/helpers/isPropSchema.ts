import { isDefined } from "@3fv/guard"
import type { PropSchema } from "serializr"

export function isPropSchema(
  thing: any
): thing is PropSchema {
  return (
    thing &&
    ["serializer", "deserializer"]
      .map(prop => thing[prop])
      .every(isDefined)
  )
}
