import {
  asOption,
  none,
  Function2,
  Predicate,
  Option,
  Function3
} from "@3fv/prelude-ts"
import { endsWith, join, map, startsWith } from "lodash/fp"
import { ClassConstructor, isDefined, isFunction, isString } from "@3fv/guard"
import {
  flatten,
  flow,
  isArray,
  isBuffer,
  isObject
} from "lodash"
import { match } from "ts-pattern"
import { throwError } from "../Exceptions"
import { getLogger } from "@3fv/logger-proxy"
import { isNotEmpty } from "../ObjectUtil"

const log = getLogger(__filename)

export interface ToJSON {
  toJSON: () => any
}

export interface FromJSON<T extends {}> extends ClassConstructor<T> {
  fromJSON: (o: any) => T
}


export function hasToJSON(o:any): o is ToJSON {
  return isFunction(o.isJSON)
}

export function hasFromJSON<T extends {}>(ctor:ClassConstructor<T>): ctor is FromJSON<T> {
  return isFunction((ctor as any).fromJSON)
}

export type JsonPrinter<Pretty extends boolean = false> =
  Pretty

/**
 * Provides all default values and solely accepts pretty or not
 *
 * @param value
 * @param {boolean} pretty
 * @returns {string}
 */
const stringify5 = (value: any, pretty: boolean) =>
  JSON.stringify(
    ...((pretty === true ? [value, null, 2] : [value]) as [
      any,
      any,
      number
    ])
  )

/**
 * Create a new printer
 *
 * @returns {(value: any, pretty?: boolean) => string}
 * @param prettyDefault
 */
export const createJsonPrinter =
  (prettyDefault = false) =>
  (value: any, pretty: boolean = prettyDefault): string =>
    pretty
      ? JSON.stringify(value, null, 2)
      : JSON.stringify(value)

export const jsonPrinter = createJsonPrinter(
  process.env.NODE_ENV !== "production"
)

export const jsonPrinterFn = Function3.of<
  any,
  boolean,
  void,
  string
>(jsonPrinter)

export const jsonStringPredicate = Predicate.of(
  isString
).and(startsWith("{"))

export const jsonLinePredicate = Predicate.of(isString)
  .and(isNotEmpty)
  .and(startsWith("{"))
  .and(endsWith("}"))

/**
 * Provides a full bound function that
 * invoked with no args, return JSON string of
 * value
 *
 * @param value
 * @returns {Function1<void, string>}
 * @param pretty
 */
export const boundJsonPrinter = (
  value: any,
  pretty: boolean = false
) => jsonPrinterFn.apply2(value ?? {}, pretty)

/**
 * Object to plain javascript object
 * @param value
 * @return {string}
 * @param pretty
 */
export function toJSON(
  value: any,
  pretty: boolean = false
): string {
  return jsonPrinter(value, pretty)
}

export function fromJSON<T = any>(
  o: string | Partial<T> | Buffer | {}
): T {
  return (isString(o) ? JSON.parse(o) : o) as T
}

export const isJsonString = (s: string) =>
  isString(s) &&
  Option.try(() => JSON.parse(s))
    .map(() => true)
    .getOrElse(false)

export const parseJson = (
  s: string,
  throwIfNotValid: boolean = false
) =>
  isString(s) &&
  Option.try(() => JSON.parse(s))
    .map(() => true)
    .getOrCall(() =>
      throwIfNotValid
        ? throwError(`Invalid JSON: ${s}`)
        : null
    )

export const isJsonLike = Predicate.of(isString)
  .or(isBuffer)
  // .or(isJsonString)
  .or(isObject)
//.or(isArray)

export const isJsonAny = Predicate.of(isString)
  .or(isObject)
  .or(isBuffer)

/**
 * Converts variant to object
 * @param {string | Buffer | T} srcData
 * @returns {T}
 */
export function toJsonAny<T = any>(
  srcData: string | Buffer | T
): T {
  return asOption(srcData)
    .filter(isJsonLike)
    .map(data =>
      match<any, any | any[]>(data)
        .when(isString, (s: string) => JSON.parse(s))
        .when(isBuffer, (buf: Buffer) =>
          asOption(buf.toString("ascii"))
            .filter(isJsonLike)
            .map(s => JSON.parse(s))
            .getOrCall(() => {
              log.error(`Invalid buffer content`, buf)
              return throwError(
                `Invalid buffer content: ${typeof buf}`
              )
            })
        )
        .when(isObject, o => o)
        .run()
    )
    .getOrCall(() => {
      log.error(
        `invalid type passed: ${typeof srcData}`,
        srcData
      )
      return throwError(
        `invalid type passed: ${typeof srcData}`
      )
    })
}

export const [stringify, parse] = [toJSON, fromJSON]

const jsonLinesTransform = flow(
  flatten,
  map(item => JSON.stringify(item)),
  join("\n")
)
export function toJsonLines(...items: any[]): string {
  return jsonLinesTransform(items)
}

// export namespace JSON {
//   export const [stringify, parse] = [toJSON, fromJSON]
// }

export default JSON
