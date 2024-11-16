import React, { useCallback, useMemo } from "react"

// CUSTOM COMPONENTS
import { nestedMenuItemsFromObject } from "./nestedMenuItemsFromObject"

// MUI
import { Button, ButtonProps as MuiButtonProps, Menu } from "@mui/material"

// MUI ICONS
import ArrowDownIcon from "@mui/icons-material/KeyboardArrowDownRounded"
import { NestedMenuItemData } from "./NestedMenuItemData"

export interface NestedDropdownProps extends MuiButtonProps {
  items: NestedMenuItemData[]
  label: string | React.ReactNode
}

export const NestedDropdown = React.forwardRef<
  HTMLButtonElement,
  NestedDropdownProps
>(function NestedDropdown(props, ref) {
  const [anchorEl, setAnchorEl] = React.useState(null)
  const open = Boolean(anchorEl)

  const { items, label, onClick, ...other } = props

  const onClickEx = useCallback(
    (event: React.MouseEvent<any>) => {
      setAnchorEl(event.currentTarget)
      onClick?.(event)
    },
    [onClick]
  )
  const onClose = useCallback(() => setAnchorEl(null), [])

  const menuItems = useMemo(
    () =>
      nestedMenuItemsFromObject({
        items,
        isOpen: open,
        onClose
      }),
    [items, open, onClose]
  )

  return (
    <div>
      <Button onClick={onClickEx} endIcon={<ArrowDownIcon />} {...other}>
        {label}
      </Button>
      <Menu anchorEl={anchorEl} open={open} onClose={onClose}>
        {menuItems}
      </Menu>
    </div>
  )
})
