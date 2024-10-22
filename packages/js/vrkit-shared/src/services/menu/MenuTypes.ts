import { Menu } from "./Menu"
import type { ActionMenuItemDesktopRole } from "../actions"


export interface MenuItem {
  id?: string
  type?: "separator" | "normal" | "submenu" | "checkbox"  | "radio"
  role?: ActionMenuItemDesktopRole
  label?: string
  click?: () => any
  checked?: boolean
  icon?: string | any
  accelerator?: string
  submenu?: Menu | MenuItem[]
}


export interface MenuRenderer<Event = any,MenuType = any, MenuItemType = any> {
  render(items: Array<MenuItem | MenuItem[]>, clickInterceptor?: MenuClickInterceptor<Event, MenuItemType>): MenuType
  
}

export type MenuClickInterceptor<Event = any,MenuItemType = any> =
  (event: Event, id: string, value: any, item: MenuItem, renderedItem: MenuItemType) => any
