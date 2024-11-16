
import React from "react"


export type MenuDataItem = {
	id: string
  label: string | React.ReactNode
	checked?: boolean
  iconUrl?: string
} & ({
	execute: () => any
  /**
   * close the menu on execute
   *
   * @default true
   */
  closeOnExecute?: boolean
} | {
	items: MenuDataItem[]
})
