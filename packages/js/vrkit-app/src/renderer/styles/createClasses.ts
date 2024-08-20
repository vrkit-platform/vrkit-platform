import { Pair } from "vrkit-app-common/utils"
import type { CSSPropertiesWithMultiValues,CSSProperties } from "@mui/styled-engine"

/**
 * Mapping class key to class name (i.e. prefixed)
 */
export type ClassNames<Names extends string> = Record<Names, string>

/**
 * Create prefixed & typed class names
 * for use with mui system
 *
 * @param {string} prefix
 * @param {Names} classNames
 * @returns {ClassNames<Names>}
 */
export function createClassNames<Names extends string>(
  prefix: string,
  ...classNames: Names[]
): ClassNames<Names> {
  return Object.fromEntries(
    classNames.map(
      className =>
        [className, [prefix, className].join("-")] as Pair<keyof Names, string>
    )
  ) as unknown as ClassNames<Names>
}

/**
 * Extract class key from `ClassNames`
 *
 * @see ClassNames
 */
export type ClassNamesKey<Names> = Names extends ClassNames<infer K> ? K : never

export type NestedCSSRules<Key extends string = any> = Record<Key, CSSPropertiesWithMultiValues | Record<string, CSSPropertiesWithMultiValues | Record<string, CSSPropertiesWithMultiValues>> | any>

/**
 * Creates fully typed class/JSS based
 * records for use with `@mui/styled-engine`
 * via `styled` defined elements
 *
 * @param {string} prefix
 * @param {Record<Key, CSSProperties>} namedRules
 * @param {CSSProperties} allRules
 * @returns {CSSPropertiesWithMultiValues}
 */
export function createClasses<Key extends string>(
  prefix: string,
  namedRules: Partial<NestedCSSRules>,
  allRules: NestedCSSRules = {}
): CSSPropertiesWithMultiValues {
  return {
    ...allRules,
    ...Object.fromEntries(
      Object.entries(namedRules).map(([className, value]) => [
        "&." + [prefix, className].join("-"),
        value
      ])
    )
  }
}
