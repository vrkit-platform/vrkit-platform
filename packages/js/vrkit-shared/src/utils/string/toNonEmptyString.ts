import { asOption } from "@3fv/prelude-ts"
import { isFunction, isString } from "@3fv/guard"
import { isNotEmpty } from "../ObjectUtil"

export function toNonEmptyString(
  producer:string | (() => string),
  defaultProducer:string | (() => string)
) {
  const producerToValue = (s:string | (() => string)) => asOption(isFunction(s) ?
    s() :
    isString(s) ? s : "")
    .filter(isNotEmpty)
    .getOrNull()
  
  return asOption(producerToValue(producer))
    .filter(isNotEmpty)
    .getOrCall(() => producerToValue(defaultProducer))
}