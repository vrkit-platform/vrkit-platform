import React from "react"
import type { MenuItemProps as MuiMenuItemProps } from "@mui/material"
import { Box, MenuItem, Typography } from "@mui/material"
import { styled } from "@mui/material/styles"
import { Ellipsis, flexAlign, FlexRow, FlexScaleZero } from "@vrkit-platform/shared-ui/styles"

const MenuItemContent = styled(Box)(({ theme }) => ({
  ...FlexRow,
  ...FlexScaleZero,
  ...flexAlign("center", "stretch"),
  justifySelf: "stretch",
  alignSelf: "stretch"
}))

export interface IconMenuItemProps {
  leftIcon?: React.ReactNode

  rightIcon?: React.ReactNode

  label?: React.ReactNode | string

  onClick?: React.MouseEventHandler<any>

  MenuItemProps?: MuiMenuItemProps

  className?: string
}

export const IconMenuItem = React.forwardRef<HTMLLIElement, IconMenuItemProps>(function IconMenuItem(
  props: IconMenuItemProps,
  ref
) {
  const { leftIcon, rightIcon, onClick, label, MenuItemProps, className } = props
  return (
    <MenuItem
      {...MenuItemProps}
      ref={ref}
      className={className}
      onClick={onClick}
    >
      <MenuItemContent>
        {leftIcon}
        <Typography
          sx={{
            ...FlexScaleZero,
            ...Ellipsis
          }}
        >
          {label}
        </Typography>
        {rightIcon}
      </MenuItemContent>
    </MenuItem>
  )
})
