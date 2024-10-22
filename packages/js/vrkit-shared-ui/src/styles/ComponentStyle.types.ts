import type { Property } from "csstype"
import {
  ColorIntensityClassKey,
  PaletteClassKey
} from "./pallete"

export type TextAlignProperty = Property.TextAlign

export type HeaderClassKey =
  | "content"
  | "pushdown"
  | "spacer"
  | "menu"
  | "normal"
  | "modal"
  | "macos"
  | "borderBottom"
  | "transparent"

export type TextClassKey =
  | "normal"
  | PaletteClassKey
//type Classes = "text"

export type ListItemColor =
  | "bg"
  | "accessory"
  | "text"
  | "subtext"
  | "boxShadow"
  | "dividerBoxShadow"

export type Size = "lg" | "xl" | "md" | "sm" | "xs"

export const Sizes = Array<Size>(
  "lg",
  "xl",
  "md",
  "sm",
  "xs"
)

export type Direction = "column" | "row"

export type Orientation = "horizontal" | "vertical"

export type TextAlign = TextAlignProperty
// "left" | "center" | "right"

export const toggleDirection = (
  direction: Direction
): Direction => (direction === "column" ? "row" : "column")
