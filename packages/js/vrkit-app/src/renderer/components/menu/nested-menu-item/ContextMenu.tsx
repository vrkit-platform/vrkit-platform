import React from "react"

// MUI
import { Menu } from "@mui/material"

// UTILS
import { nestedMenuItemsFromObject } from "./nestedMenuItemsFromObject"
import type { ReactChildren } from "vrkit-shared-ui"
import { NestedMenuItemData } from "./NestedMenuItemData"

export interface ContextMenuProps {
  items: NestedMenuItemData[]
  children: ReactChildren
}

export const ContextMenu = React.forwardRef<HTMLDivElement, ContextMenuProps>(
  function ContextMenu({ children, items }, ref) {
    const [menuPosition, setMenuPosition] = React.useState(null)
    const [mouseDownPosition, setMouseDownPosition] = React.useState(null)

    const handleItemClick = event => {
      setMenuPosition(null)
    }

    const handleMouseDown = event => {
      if (menuPosition !== null) {
        setMenuPosition(null)
      }

      if (event.button !== 2) return

      setMouseDownPosition({
        top: event.clientY,
        left: event.clientX
      })
    }

    const handleMouseUp = event => {
      const top = event.clientY
      const left = event.clientX

      if (mouseDownPosition === null) return

      if (mouseDownPosition.top === top && mouseDownPosition.left === left) {
        setMenuPosition({
          top: event.clientY,
          left: event.clientX
        })
      }
    }

    const menuItems = nestedMenuItemsFromObject({
      items,
      isOpen: !!menuPosition,
      onClose: handleItemClick
    })

    return (
      <div
        ref={ref}
        onContextMenu={e => e.preventDefault()}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
      >
        <Menu
          onContextMenu={e => e.preventDefault()}
          open={!!menuPosition}
          onClose={() => setMenuPosition(null)}
          anchorReference="anchorPosition"
          anchorPosition={menuPosition}
        >
          {menuItems}
        </Menu>
        {children}
      </div>
    )
  }
)
