import { isFunction, isNumber, isString } from "@3fv/guard"
import { instanceOf, Predicate } from "@3fv/prelude-ts"
// import type { ArrayItemType } from "vrkit-app-common/utils"
import { Buffer } from "buffer"
import type { IDebugger } from "debug"
import { isTrue } from "./fp/Tests"
import { isNotEmptyString } from "./ObjectUtil"
import { ArrayItemType } from "./Types"

export const isBuffer = instanceOf(Buffer)

export const isArray = (
  o: any
): o is Array<ArrayItemType<typeof o>> => Array.isArray(o)
//(typeof Array<infer T> Array.isArray.bind(Array)

export function isError(o: any): o is Error {
  return o instanceof Error
}

export function isDebug(o: any): o is IDebugger {
  return [
    isFunction(o),
    isFunction(o.log),
    isNotEmptyString(o.namespace)
  ].every(isTrue)
}

export const isStringOrNumberPredicate =
  Predicate.of(isString).or(isNumber)
