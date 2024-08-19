import { isString } from "@3fv/guard"

export type StringParts = Array<
  string | undefined | false | null
>

export enum JoinPoint {
  START = "START",
  END = "END"
}

export type JoinPointKind = JoinPoint | `${JoinPoint}`
/**
 * Append `parts` as a combiner, which when invoked,
 * filters any `falsey` values
 *
 * @param {Array<any>} parts
 * @returns {any}
 */
export function join(
  from: StringParts | string,
  joinPoint: JoinPointKind = "END",
  delimiter: string = ""
) {
  const fromArray = isString(from) ? [from] : from
  return (...to: StringParts) =>
    (joinPoint === "END"
      ? [...to.flat(), ...fromArray.flat()]
      : [...fromArray.flat(), ...to.flat()]
    )
      .filter(isString)
      .join(delimiter)
}
