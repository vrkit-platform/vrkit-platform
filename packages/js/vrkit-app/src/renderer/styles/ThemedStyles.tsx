import * as React from "react"
import { CSSProperties } from "react"
import * as CSS from "csstype"
import { isArray, isFunction, isNumber, isObject, isString } from "@3fv/guard"
import { getLogger } from "@3fv/logger-proxy"
import * as _ from "lodash"
import { assign, flow, isEmpty, omit, partition, uniq } from "lodash"
import { arrayOf, digitsOnly, throwError, toDashCase } from "vrkit-app-common/utils"
import tinycolor from "tinycolor2"
import { asOption, Option, Predicate } from "@3fv/prelude-ts"
import { endsWith, get, replace } from "lodash/fp"
import { P, match } from "ts-pattern"

const log = getLogger(__filename)

/**
 * Get current HTML document root font size (what REM units are based on)
 *
 * @returns {number}
 */
export function getDocumentFontSize(): number {
  return typeof getComputedStyle === "function"
    ? parseFloat(
        getComputedStyle(document.documentElement).fontSize
      )
    : 10
}

export type CSSSize = CSS.Globals | number | string

export enum ViewportMode {
  Portrait,
  Landscape,
  Desktop,
  DesktopBig
}

export function mergeClasses(
  ...classes: Array<string | null | false>
): string {
  return classes.filter(clazz => isString(clazz)).join(" ")
}

export type AnyCSSProperties = CSSProperties & any

//export type NestedStyles = CSSProperties | { [key: string]: Style  } | Style //| Styles

/**
 * Size update
 */
function updateSize(): void {
  const width = window.innerWidth,
    newSize =
      width >= 1280
        ? ViewportMode.DesktopBig
        : width >= 1024
        ? ViewportMode.Desktop
        : width >= 667
        ? ViewportMode.Landscape
        : ViewportMode.Portrait

  log.debug(`Window resized: ${width}/${newSize}`)
  // viewportSize = newSize
}

if (
  typeof window !== "undefined" &&
  isFunction(window.addEventListener)
) {
  updateSize()
  window.addEventListener("resize", updateSize)
}


export type CSSPropFn<P = any> = (
  props: P
) => number | string

export function allowYOverflow(style: CSSProperties) {
  return omit(style, "overflow")
}

export function dimensionConstraint<P = any>(
  dim: "width" | "height",
  val: string | number | CSSPropFn<P>
): CSSProperties {
  const dimUpper =
    dim.charAt(0).toUpperCase() + dim.substring(1)
  return {
    [dim]: val,
    [`min${dimUpper}`]: val,
    [`max${dimUpper}`]: val
    //overflow: "hidden"
  } as any
}

export function normalizeCSSProps(
  ...props: Array<string | string[]>
): Array<keyof CSS.StandardLonghandProperties> {
  return Option.of(
    props.reduce(
      (allProps: Array<string>, prop) =>
        Array<string>(
          ...allProps,
          ...(Array.isArray(prop) ? prop : [prop])
        ),
      Array<string>()
    )
  )
    .map((props: Array<string>) =>
      uniq([...props, ...props.map(toDashCase)])
    )
    .get() as Array<keyof CSS.StandardLonghandProperties>
}

export const WebkitBoxDisplay = "-webkit-box"
export const WebkitFillAvailable = "-webkit-fill-available"

export const PlaceholderSelector =
  "&::-webkit-input-placeholder"

export const FlexProperties = normalizeCSSProps([
  "flex-basis",
  "flex-grow",
  "flex-shrink",
  "flex"
])

export const HeightProperties = normalizeCSSProps([
  "height",
  "maxHeight",
  "minHeight"
])

export const WidthProperties = normalizeCSSProps([
  "width",
  "maxWidth",
  "minWidth"
])

export const PaddingProperties = normalizeCSSProps([
  "paddingTop",
  "paddingRight",
  "paddingBottom",
  "paddingLeft"
])

export const SizeProperties = uniq(
  Array<keyof CSS.StandardLonghandProperties>(
    ...HeightProperties,
    ...WidthProperties
  )
)

export const WebkitBox = {
  display: WebkitBoxDisplay
} as CSSProperties

export const webkitBoxClamp = (
  lines: number = 1
): CSSProperties => ({
  WebkitLineClamp: lines,
  flexDirection: "row",
  display: WebkitBoxDisplay
})

export function heightConstraint<P>(
  val: CSSSize | CSSPropFn<P>
): CSSProperties {
  return dimensionConstraint<P>("height", val)
}

export function widthConstraint<P>(
  val: string | number | CSSPropFn<P>
): CSSProperties {
  return dimensionConstraint<P>("width", val)
}

// noinspection JSSuspiciousNameCombination
export function dimensionConstraints<P>(
  width: string | number | CSSPropFn<P>,
  height: string | number | CSSPropFn<P> = width
): CSSProperties {
  return {
    ...heightConstraint(height),
    ...widthConstraint(width)
  }
}

export const FillHeightAvailable = heightConstraint(
  WebkitFillAvailable
) as CSSProperties

export const FillHeight = heightConstraint(
  "100%"
) as CSSProperties

export const FillWidth = widthConstraint(
  "100%"
) as CSSProperties

export const Fill = {
  ...FillWidth,
  ...FillHeight
} as CSSProperties

export const FillBounds = {
  top: 0,
  right: 0,
  bottom: 0,
  left: 0
} as CSSProperties



export const FillWindow = Object.assign(
  widthConstraint("100vw"),
  heightConstraint("100vh")
) as CSSProperties

export const Transparent = "transparent"

export const BorderBoxSizing = {
  boxSizing: "border-box"
} as CSSProperties

export const OverflowVisible = {
  overflow: "visible"
} as CSSProperties

export const OverflowHidden = {
  overflow: "hidden"
} as CSSProperties

export const OverflowAuto = {
  overflow: "auto"
} as CSSProperties

//region Cursors
export const CursorPointer = {
  cursor: "pointer"
} as CSSProperties
//endregion

export const Ellipsis = makeStyle({
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis"
}) as CSSProperties

//region Positioning
export const PositionRelative: CSSProperties = {
  position: "relative"
}

export const PositionAbsolute: CSSProperties = {
  position: "absolute"
}

export const AbsolutePositions = {
  fill: {
    top: 0,
    left: 0,
    right: 0,
    bottom: 0
  },
  topLeft: {
    top: 0,
    left: 0
  },
  top: {
    top: 0,
    left: 0,
    right: 0
  },
  bottom: {
    bottom: 0,
    left: 0,
    right: 0
  },
  bottomRight: {
    bottom: 0,
    right: 0
  }
}

export const TransitionDuration = {
  Short: 250,
  Long: 500
}

export function alpha(
  color: CSS.DataType.Color,
  alpha: number
): CSS.DataType.Color {
  return tinycolor(color).setAlpha(alpha).toRgbString()
}

/**
 * Create a transition property with default config
 *
 * @global
 *
 * @param props
 * @param duration
 * @param easing
 * @returns {{transition: any}}
 * @param delay
 */
export function transition(
  props: string[] | string | null = null,
  duration = TransitionDuration.Short,
  easing = "ease-out",
  delay: number = 0
): CSSProperties {
  if (isString(props)) props = [props]

  props = uniq(
    (props ?? ["all"]).map(toDashCase)
  ) as string[]

  return {
    transition: props
      .map(
        prop => `${prop} ${duration}ms ${easing} ${delay}ms`
      )
      .join(", ")
  }
}

export function flexAlign(
  alignItems: CSS.Property.AlignItems,
  justifyContent: CSS.Property.JustifyContent = alignItems as any
): CSSProperties {
  return { justifyContent, alignItems }
}

// noinspection JSSuspiciousNameCombination
export function padding(
  top:
    | string
    | number
    | ((props: any) => string | number) = 0,
  right:
    | string
    | number
    | ((props: any) => string | number) = top,
  bottom:
    | string
    | number
    | ((props: any) => string | number) = top,
  left:
    | string
    | number
    | ((props: any) => string | number) = right
): CSSProperties {
  return {
    paddingTop: top,
    paddingRight: right,
    paddingBottom: bottom,
    paddingLeft: left
  } as any
}

// noinspection JSSuspiciousNameCombination
export function paddingRem(
  top = 0,
  right = top,
  bottom = top,
  left = right
): CSSProperties {
  return padding(
    remToPx(top),
    remToPx(right),
    remToPx(bottom),
    remToPx(left)
  ) as any
}

export function borderRadius(
  borderTopLeftRadius: number | string,
  borderTopRightRadius:
    | number
    | string = borderTopLeftRadius,
  borderBottomLeftRadius:
    | number
    | string = borderTopLeftRadius,
  borderBottomRightRadius:
    | number
    | string = borderTopRightRadius
): CSSProperties {
  return {
    borderTopLeftRadius,
    borderTopRightRadius,
    borderBottomLeftRadius,
    borderBottomRightRadius
  }
}

export function border(
  top = 0,
  right = top,
  bottom = top,
  left = right
): CSSProperties {
  return {
    borderTop: top,
    borderRight: right,
    borderBottom: bottom,
    borderLeft: left
  } as any
}

export function borderRem(
  top = 0,
  right = top,
  bottom = top,
  left = right
): CSSProperties {
  return border(
    remToPx(top),
    remToPx(right),
    remToPx(bottom),
    remToPx(left)
  ) as any
}

export function margin(
  top: string | number = 0,
  right = top,
  bottom = top,
  left = right
): CSSProperties {
  return {
    marginTop: top,
    marginRight: right,
    marginBottom: bottom,
    marginLeft: left
  } as any
}

export function marginRem(
  top = 0,
  right = top,
  bottom = top,
  left = right
): CSSProperties {
  return margin(
    rem(top),
    rem(right),
    rem(bottom),
    rem(left)
  )
}

/**
 * Padding property keys
 *
 * @type {string[]}
 */
export const PaddingProps = Object.keys(
  paddingRem(0)
).map(key =>
  key.replace(/([A-Z])/g, g => `-${g[0].toLowerCase()}`)
)

/**
 * Margin property keys
 *
 * @type {string[]}
 */
export const MarginProps = Object.keys(
  marginRem(0)
).map(key =>
  key.replace(/([A-Z])/g, g => `-${g[0].toLowerCase()}`)
)

/**
 * Border property keys
 *
 * @type {string[]}
 */
export const BorderProps = Object.keys(
  borderRem(0)
).map(key =>
  key.replace(/([A-Z])/g, g => `-${g[0].toLowerCase()}`)
)

export type RemResult<AsRem extends boolean | undefined> = AsRem extends true ? string : number

/**
 * Convert a number to rem
 *
 * @example
 * ```javascript
 * // asRem === true, default
 * rem(1.2) // "1.2rem"
 *
 * // asRem !== true, assuming current document font size is 10px
 * rem(1.2) // 1.2 * getDocumentFontSize() = 12px
 * ```
 * @param {number} val
 * @param {boolean} asRem
 * @returns {string & WidthProperty<any>}
 */
export function rem<AsRem extends boolean | undefined, Result extends RemResult<AsRem> = RemResult<AsRem>>(val: number, asRem?: AsRem ): Result & CSS.Property.Width<any>{
  if (asRem !== false)
    asRem = true as AsRem
  return asRem === true ? `${val}rem` : remToPx(val) //${val}rem`
}

export function px(val: number | string): string {
  return `${val}px`
}

export const FlexAuto = flex(0, 0, "auto")

// export type CSSProperties = CSSProperties
//   Omit<
//   CSSProperties,
//   | "columnFill"
//   | "-moz-appearance"
//   | "MozAppearance"
//   | "appearance"
//   | "lineBreak"
//   | "translate"
//   | "xs"
//   | "sm"
//   | "md"
//   | "lg"
//   | "xl"
// >


/**
 * Create flex config, default is scale any size
 *
 * @param flexGrow
 * @param flexShrink
 * @param flexBasis
 */
export function flex(
  flexGrow: CSS.Property.Flex<any> = 1,
  flexShrink: CSS.Property.Flex<any> = 1,
  flexBasis: CSS.Property.FlexBasis<any> = "auto"
): CSSProperties {
  return {
    flexGrow,
    flexShrink,
    flexBasis
  }
}

/**
 * Flex Align Center
 *
 * @type {CSSProperties}
 */
export const FlexAlignCenter: CSSProperties = flexAlign("center")

/**
 * Flex Align Start
 *
 * @type {CSSProperties}
 */
export const FlexAlignStart: CSSProperties = flexAlign("flex-start")

export const FlexAlignEnd = flexAlign("flex-end")

export const FlexAlignSpaceBetween =
  flexAlign("space-between")

export const FlexScale = flex()

export const FlexScaleZero = { ...FlexScale, flexBasis: 0 }

export const FlexAutoGrow = flex(1, 0, "auto")

export const FlexWrap = {
  flexWrap: "wrap"
} as CSSProperties

export const FlexNowrap = {
  flexWrap: "nowrap"
} as CSSProperties

//region Flexbox
export const Flex = {
  display: "flex"
} as CSSProperties

export const FlexRow = makeStyle(Flex, {
  flexDirection: "row"
}) as CSSProperties

export const FlexRowReverse = makeStyle(Flex, {
  flexDirection: "row-reverse"
}) as CSSProperties

export const FlexRowCenter = makeStyle(
  FlexRow,
  FlexAlignCenter
)

export const FlexInlineRowCenter = makeStyle(
  FlexRow,
  FlexAlignCenter,
  {
    display: "inline-flex"
  }
)

export const FlexColumn = makeStyle(Flex, {
  flexDirection: "column"
}) as CSSProperties

export const FlexColumnReverse = makeStyle(Flex, {
  flexDirection: "column-reverse"
})

export const FlexColumnCenter = makeStyle(
  FlexColumn,
  FlexAlignCenter
)

export function makeStyle(...styles): CSSProperties {
  return Object.assign(
    {},
    ...styles.reduce((allStyles, style) => {
      if (Array.isArray(style)) {
        allStyles.push(...style)
      } else {
        allStyles.push(style)
      }
      return allStyles
    }, [])
  )
}

export const FlexDefaults = {
  stretch: {
    ...flexAlign("stretch", "stretch")
  },
  stretchSelf: {
    justifySelf: "stretch",
    alignSelf: "stretch"
  } as CSSProperties,
  centerSelf: {
    justifySelf: "center",
    alignSelf: "center"
  } as CSSProperties,
  rowCenterFillWidth: {
    ...FlexRowCenter,
    ...FillWidth,
    ...PositionRelative,
    ...OverflowHidden
  },
  rowStretchFillWidth: {
    ...FlexRow,
    ...FillWidth,
    ...PositionRelative,
    ...OverflowHidden,
    ...flexAlign("stretch", "stretch")
  },
  columnStretchFillWidth: {
    ...FlexColumn,
    ...FillWidth,
    ...PositionRelative,
    ...OverflowHidden,
    ...flexAlign("stretch", "center")
  },
  ellipsisScale: {
    ...FlexScaleZero,
    ...OverflowHidden,
    ...Ellipsis
  }
}

export const remOrDigitsTest = Predicate.of(
  endsWith("rem")
).or(digitsOnly)

const mapRemToNumber = flow(replace(/rem/g, ""), parseFloat)

export function remToNumber(rem: string | number) {
  return mapRemToNumber(
    isString(rem) ? rem : rem.toString()
  )
}

export function remToPx(rem: number | string): number {
  return asOption(
    match(rem)
      .with(P.string, rem =>
        asOption(rem)
          .filter(remOrDigitsTest)
          .map(mapRemToNumber)
          .getOrThrow(
            `Value (${rem}), if a string, must end with rem`
          )
      )
      .with(P.number, rem => rem)
      .otherwise(() => {
        throwError(`Unable to determine type: ${rem}`)
      })
  )
    .map(value => Math.round(value * getDocumentFontSize()))
    .get()
}

export function directChild(
  className: string,
  state: string = ""
): string {
  return child(className, state, true)
}

export function child(
  className: string | string[],
  state: string = "",
  direct: boolean = false
): string {
  const classNames = arrayOf(className)
  return classNames.map(className => `&${isEmpty(state) ? "" : `:${state}`} ${
    direct ? ">" : ""
  } .${className}`).join(",")
}

export function hasCls(
  className: string | string[]
): string {
  const classNames = arrayOf(className)
  return `&${classNames.map(className => `.${className}`).join("")}`
}

export function important(value: string | number): string {
  return `${isNumber(value) ? px(value) : value} !important`
}

export function radialGradient(
  ...colorStops: string[]
): string {
  //return `-webkit-linear-gradient(${colorStops.join(',')})`
  return `radial-gradient(${colorStops.join(",")})`
}

export function linearGradient(
  ...colorStops: string[]
): string {
  //return `-webkit-linear-gradient(${colorStops.join(',')})`
  return `linear-gradient(${colorStops.join(",")})`
}

export function linearGradientRule(
  ...colorStopsAndCSS: Array<string | CSSProperties>
): CSSProperties {
  //return `-webkit-linear-gradient(${colorStops.join(',')})`
  const [colorStops, otherCss] = partition(
    colorStopsAndCSS,
    isString
  )
  return assign(
    {
      background:
        `linear-gradient(${[...colorStops].join(",")})` +
        asOption(
          otherCss.map(get("background")).filter(Boolean)
        ).map(backgrounds =>
          isEmpty(backgrounds)
            ? ""
            : `,` + backgrounds.join(", ")
        )
    },
    ...otherCss.map(css => omit(css, ["background"]))
  )
}

export function linearGradientContentBox(
  ...colorStops: Array<string>
): string {
  //return `-webkit-linear-gradient(${colorStops.join(',')})`
  return `content-box ${linearGradient(...colorStops)}`
}
