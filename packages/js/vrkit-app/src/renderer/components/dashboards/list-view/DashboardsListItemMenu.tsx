// REACT
import React, { useEffect } from "react"

// CLSX
// 3FV
import { getLogger } from "@3fv/logger-proxy"

// MUI
import clsx from "clsx"
import { AppFAIcon } from "../../app-icon"
import { DashboardConfig } from "@vrkit-platform/models"
import IconButton, { IconButtonProps } from "@mui/material/IconButton"
import { faEllipsisVertical, faTrash } from "@awesome.me/kit-79150a3eed/icons/sharp/solid"
import Divider from "@mui/material/Divider"
import Menu from "@mui/material/Menu"
import MenuItem from "@mui/material/MenuItem"
import { faGridHorizontal } from "@awesome.me/kit-79150a3eed/icons/duotone/solid"
import { noop } from "lodash"
import { dashboardsListViewClasses } from "./DashboardsListView"
import Tooltip from "@mui/material/Tooltip"

const log = getLogger(__filename)
const { info, debug, warn, error } = log

export interface DashboardsListItemMenuProps extends Omit<IconButtonProps, "onClick"> {
  config: DashboardConfig

  disabled?: boolean

  isDefault: boolean

  onDelete: () => any

  onSetAsDefault: () => any
}

export function DashboardsListItemMenu({
  onDelete,
  onSetAsDefault,
  isDefault,
  config,
  disabled = false,
  ...other
}: DashboardsListItemMenuProps) {
  const id = config.id,
    menuId = `dashboard-item-menu-${id}`,
    buttonId = `dashboard-item-menu-button-${id}`,
    [anchorEl, setAnchorEl] = React.useState<HTMLElement>(null),
    open = Boolean(anchorEl),
    handleClick = (event: React.MouseEvent<HTMLElement>) => {
      setAnchorEl(event.currentTarget)
    },
    newCloseEventHandler =
      (fn: Function = null) =>
      () => {
        if (fn) {
          fn()
        }
        setAnchorEl(null)
      }
  
  // NOTE: Alternative to disabling buttons; disable the whole menu and hide it
  // useEffect(() => {
  //   if (Boolean(anchorEl) && disabled) {
  //     setAnchorEl(null)
  //   }
  // }, [disabled, anchorEl])
  return (
    <>
      <Tooltip title={disabled ? "Dashboard is active, you can not delete or modify" : "Additional dashboard actions"}>
        <IconButton
          id={buttonId}
          className={clsx(dashboardsListViewClasses.itemAction)}
          aria-controls={open ? menuId : undefined}
          aria-haspopup="true"
          aria-expanded={open ? "true" : undefined}
          onClick={handleClick}
          {...other}
        >
          <AppFAIcon
            icon={faEllipsisVertical}
            size="2xs"
          />
        </IconButton>
      </Tooltip>
      <Menu
        id={menuId}
        MenuListProps={{
          "aria-labelledby": buttonId
        }}
        anchorEl={anchorEl}
        open={open}
        onClose={newCloseEventHandler()}
      >
        <MenuItem
          className={clsx(dashboardsListViewClasses.itemAction, "delete", "menuAction")}
          onClick={newCloseEventHandler(onDelete)}
          disabled={disabled}
        >
          <AppFAIcon
            size="2xs"
            icon={faTrash}
          />
          Delete
        </MenuItem>
        {!isDefault && <Divider sx={{ my: 0.5 }} />}
        {!isDefault && (
          <MenuItem
            className={clsx(dashboardsListViewClasses.itemAction, "setAsDefault", "menuAction")}
            onClick={newCloseEventHandler(isDefault ? noop : onSetAsDefault)}
            disabled={disabled}
          >
            <AppFAIcon
              size="2xs"
              icon={faGridHorizontal}
            />
            Set as Default
          </MenuItem>
        )}
      </Menu>
    </>
  )
}

export default DashboardsListItemMenu
