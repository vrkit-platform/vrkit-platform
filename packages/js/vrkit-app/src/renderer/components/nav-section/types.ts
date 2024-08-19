import { isArray, isDefined } from "@3fv/guard"
import type { ButtonBaseProps } from "@mui/material/ButtonBase"
import type { CSSObject, SxProps, Theme } from "@mui/material/styles"
import React from "react"

// ----------------------------------------------------------------------

export type SlotProps = {
  rootItem?: NavItemSlotProps
  subItem?: NavItemSlotProps
  subheader?: SxProps<Theme>
  paper?: SxProps<Theme>
  currentRole?: string
}

export type NavItemRenderProps = {
  navIcon?: Record<string, React.ReactNode>
  navInfo?: (val: string) => Record<string, React.ReactElement>
}

export type NavItemSlotProps = {
  sx?: SxProps<Theme>
  icon?: SxProps<Theme>
  texts?: SxProps<Theme>
  title?: SxProps<Theme>
  caption?: SxProps<Theme>
  info?: SxProps<Theme>
  arrow?: SxProps<Theme>
}

export type NavItemStateProps = {
  depth?: number
  open?: boolean
  active?: boolean
  hasChild?: boolean
  externalLink?: boolean
  enabledRootRedirect?: boolean
}

export type NavItemBaseProps = {
  path: string
  title: string
  children?: any
  caption?: string
  roles?: string[]
  disabled?: boolean
  render?: NavItemRenderProps
  slotProps?: NavItemSlotProps
  icon?: string | React.ReactNode
  info?: string[] | React.ReactNode
}

export type NavItemProps = ButtonBaseProps &
  NavItemStateProps &
  NavItemBaseProps

export type NavListProps = {
  depth: number
  cssVars?: CSSObject
  slotProps?: SlotProps
  data: NavItemBaseProps
  render?: NavItemBaseProps["render"]
  enabledRootRedirect?: NavItemStateProps["enabledRootRedirect"]
}

export type NavSubListProps = Omit<NavListProps, "data"> & {
  data: NavItemBaseProps[]
}

export type NavGroupWithItemsProps = {
  subheader?: string
  items: NavItemBaseProps[]
}

export type NavGroupProps = Omit<NavListProps, "data" | "depth"> &
  NavGroupWithItemsProps

export type NavRootItemProps = Omit<NavListProps, "data" | "depth"> & {
  item: NavItemBaseProps
}

export type NavSectionProps = Omit<NavListProps, "data" | "depth"> & {
  sx?: SxProps<Theme>
  data: Array<NavGroupWithItemsProps | NavItemBaseProps>
}

export function isNavDataGroupWithItems(o: any): o is NavGroupWithItemsProps {
  return isDefined(o?.items) && isArray(o.items)
}

export function isNavDataItem(o: any): o is NavItemBaseProps {
  return !isDefined(o.items)
}
