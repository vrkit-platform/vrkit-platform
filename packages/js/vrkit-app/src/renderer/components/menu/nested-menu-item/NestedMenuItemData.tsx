import React from "react"


export interface NestedMenuItemData {
  leftIcon?: React.ReactNode
  rightIcon?:React.ReactNode
  label?:React.ReactNode | string
  items?: NestedMenuItemData[]
  onClick?: React.MouseEventHandler<any>
  key?: string
}

