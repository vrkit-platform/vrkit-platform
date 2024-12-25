import React from "react"
import { NestedMenuItem } from "./NestedMenuItem"
import { IconMenuItem } from "./IconMenuItem"
import { isNotEmpty } from "@vrkit-platform/shared/utils"
import { NestedMenuItemData } from "./NestedMenuItemData"

export interface NestedMenuItemsFromObjectOptions {
  items: NestedMenuItemData[]
  isOpen?: boolean
  onClose?: React.MouseEventHandler<any>
}

/**
 * Create a JSX element with nested elements creating a nested menu.
 * Every menu item should have a key provided
 */
export function nestedMenuItemsFromObject({ items, isOpen, onClose }:NestedMenuItemsFromObjectOptions) {
  return items.map(item => {
    const { leftIcon, rightIcon, label, items, onClick, key } = item

    if (items && isNotEmpty(items)) {
      // Recurse deeper
      return (
        <NestedMenuItem
          key={key}
          leftIcon={leftIcon}
          rightIcon={rightIcon}
          label={label}
          parentMenuOpen={isOpen}
        >
          {/* Call this function to nest more items */}
          {nestedMenuItemsFromObject({ items, isOpen, onClose })}
        </NestedMenuItem>
      )
    } else {
      // No children elements, return MenuItem
      return (
        <IconMenuItem
          key={key}
          leftIcon={leftIcon}
          rightIcon={rightIcon}
          label={label}
          onClick={event => {
            onClose?.(event)
            onClick?.(event)
          }}
        />
      )
    }
  })
}
