import { isPrimitive } from "./assignDeep"
import { transformValues } from "./ObjectUtil"
import { isFunction } from "@3fv/guard"
import { isArray } from "./Guards"

export function toPlainObjectDeep(o: any, recordSet: Set<{}> = new Set<{}>(), depth: number = 0): any {
  if (depth > 3) {
    return null
  }

  if (recordSet.has(o)) {
    return null
  }

  let transformFn: (...args: any[]) => any = null

  transformFn = (k, value) => {
    if (isArray(value)) {
      return transformValues(value, transformFn)
    }

    if (isFunction(value)) {
      return null
    }

    if (typeof value === "bigint") {
      return value.toString() + "n"
    }
    if (!value || isPrimitive(value)) {
      return value
    }

    recordSet.add(value)
    return toPlainObjectDeep(value, recordSet, depth + 1)
  }
  return transformValues(o, transformFn)
}

/**
 * copied from
 * https://github.com/Ivan-Korolenko/json-with-bigint/blob/main/json-with-bigint.js
 *
 * Function to serialize data to JSON string
 *  Converts BigInt values to custom format (strings with digits and "n" at the
 * end) and then converts them to proper big integers in JSON string
 *
 * @param data
 * @param space
 */
export function JSONStringifyAny(data: any, space: number = undefined): string {
  const bigInts = /([\[:])?"(-?\d+)n"([,\}\]])/g
  const plainData = toPlainObjectDeep(data)
  const json = JSON.stringify(plainData, null, space)

  return json.replace(bigInts, "$1$2$3")
}

/**
 * copied from
 * https://github.com/Ivan-Korolenko/json-with-bigint/blob/main/json-with-bigint.js
 *
 * Function to parse JSON
 *  If JSON has values presented in a lib's custom format (strings with digits
 * and "n" character at the end), we just parse them to BigInt values (for
 * backward compatibility with previous versions of the lib) If JSON has values
 * greater than Number.MAX_SAFE_INTEGER, we convert those values to our custom
 * format, then parse them to BigInt values. Other types of values are not
 * affected and parsed as native JSON.parse() would parse them.
 *
 *  Big numbers are found and marked using RegEx with these conditions:
 *  - Before the match there is no . and there is ": OR ":[ OR
 * ":[anyNumberOf(anyCharacters) with no \ before them
 *  - The match itself has more than 16 digits OR (16 digits and any digit of
 * the number is greater than that of the Number.MAX_SAFE_INTEGER). And it may
 * have a - sign at the start
 *  - After the match there is , OR } without " after it OR ] without " after
 * it
 *
 * @param jsonStr
 * @constructor
 */
export function JSONParseAny<T = any>(jsonStr: string): T {
  const numbersBiggerThanMaxInt =
    /(?<=[^\\]":[\[]?|[^\\]":\[.*[^\.\d*])(-?\d{17,}|-?(?:[9](?:[1-9]07199254740991|0[1-9]7199254740991|00[8-9]199254740991|007[2-9]99254740991|007199[3-9]54740991|0071992[6-9]4740991|00719925[5-9]740991|007199254[8-9]40991|0071992547[5-9]0991|00719925474[1-9]991|00719925474099[2-9])))(?=,|\}[^"]?|\][^"])/g

  const cleanJsonStr = jsonStr.replace(numbersBiggerThanMaxInt, `"$1n"`)

  return JSON.parse(cleanJsonStr, (_, value) => {
    if (typeof value === "string" && Boolean(value.match(/^-?\d+n$/))) {
      return BigInt(value.substring(0, value.length - 1))
    }

    return value
  })
}
