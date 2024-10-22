import type * as React from "react"
import type { HTMLAttributes, ReactNode } from "react"
import type * as CSS from "csstype"
import type { Size } from "./ComponentStyle.types"
import type { Theme as MaterialTheme } from "@mui/material"

export type JSSFontface = CSS.AtRule.FontFace & {
  fallbacks?: CSS.AtRule.FontFace[]
}

export type PropsFunc<Props extends object, T> = (
  props: Props
) => T


export type ClassNameMap<ClassKey extends string = string> =
  Record<ClassKey, string>

export interface ThemeProps {
  theme?: MaterialTheme
}

export enum AlignItems {
  start = "flex-start",
  center = "center",
  end = "flex-end",
  stretch = "stretch"
}

export enum JustifyContent {
  start = "flex-start",
  center = "center",
  end = "flex-end",
  stretch = "stretch"
}

export interface FlexAlign {
  alignItems: AlignItems
  justifyContent: JustifyContent
}

export type Or<A, B, C = false> = A extends true
  ? true
  : B extends true
  ? true
  : C extends true
  ? true
  : false

export type And<A, B, C = true> = A extends true
  ? B extends true
    ? C extends true
      ? true
      : false
    : false
  : false

/**
 * @internal
 *
 * check if a type is `{}`
 *
 * 1. false if the given type has any members
 * 2. false if the type is `object` which is the only other type with no members
 *  {} is a top type so e.g. `string extends {}` but not `string extends object`
 * 3. false if the given type is `unknown`
 */
export type IsEmptyInterface<T> = And<
  keyof T extends never ? true : false,
  string extends T ? true : false,
  unknown extends T ? false : true
>

/**
 * Like `T & U`, but using the value types from `U` where their properties overlap.
 *
 * @internal
 */
export type Overwrite<T, U> = Omit<T, keyof U> & U


export type ControlSize = Size

