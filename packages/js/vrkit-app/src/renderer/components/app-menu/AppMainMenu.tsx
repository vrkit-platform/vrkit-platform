import { getLogger } from "@3fv/logger-proxy"
import { Link as RouterLink } from "react-router-dom"
import { ClickAwayListener, IconButton, ListItemText, MenuItem, MenuList as MuiMenuList } from "@mui/material"
import { lighten, styled } from "@mui/material/styles"
import type { ThemeId } from "vrkit-shared/models"
import { ThemeType } from "vrkit-models"

// APP
import { ClassNamesKey, createClassNames, FlexAuto, FlexRowCenter, PositionRelative, rem } from "vrkit-shared-ui/styles"
import React, { useRef, useState } from "react"
// import { useAppDispatch } from "@taskx/lib-shared-web/services/store"
// import { globalActions } from
// "@taskx/lib-shared-web/services/store/slices/global"
import { useAppMainMenuDataItems } from "./useAppMainMenuDataItems"
import { useElectronContextMenu } from "../../hooks/useElectronContextMenu"
import MenuDivider from "../menu/divider"
import { NestedMenuItem } from "../menu"
import PopoverMenu from "../menu/popover-menu"
import { AppIcon } from "../icon"
import { Logo } from "../logo"
// import {faBars as fasBars} from "@fortawesome/pro-solid-svg-icons"
import { faBars as falBars } from "@awesome.me/kit-79150a3eed/icons/sharp/light"
import { isElectron } from "../../renderer-constants"
import { useAppDispatch } from "../../services/store"
import { useService } from "../service-container"
import { AppSettingsClient } from "../../services/app-settings-client"
// import {faBars as falBars} from "@fortawesome/pro-light-svg-icons"
// import {faBars as fadBars} from "@fortawesome/pro-duotone-svg-icons"

const log = getLogger(__filename)
const { info, debug, warn, error } = log

const classPrefix = "MainMenu-MuiMenuList"
export const mainMenuListClasses = createClassNames(classPrefix)
export type MainMenuListClassKey = ClassNamesKey<typeof mainMenuListClasses>

const AppMainMenuList = styled(MuiMenuList)(({ theme }) => ({
  backgroundColor: lighten(theme.palette.background.paper, 0.1),
  borderRadius: theme.shape.borderRadius,
  boxShadow: theme.shadows[6]
}))

const AppMainMenuButton = styled<typeof IconButton>(IconButton)(({ theme }) => ({
  ...FlexAuto,
  ...FlexRowCenter,
  ...PositionRelative,
  height: "2.5rem",
  width: rem(2.5),
  maxHeight: "min(100%,2.5rem)",
  alignSelf: "center",
  justifySelf: "center",
  "& svg": {
    maxHeight: "100%",
    filter: `drop-shadow(0 0 1rem rgba(0,0,0,1))`,
    "& g": {
      // filter: `drop-shadow(0 0 1rem rgba(0,0,0,1))`
      boxShadow: theme.shadows[4]
    }
  },
  margin: theme.spacing(1, 1, 2, 2)
}))

/**
 * MainMenu Component Properties
 */
export interface AppMainMenuProps {}

export function AppMainMenu(_props: AppMainMenuProps) {
  const
    anchorRef = useRef<HTMLElement>(),
    settingsClient = useService(AppSettingsClient),
    [open, setOpen] = useState(false),
    handleClick = (_event: React.MouseEvent<HTMLButtonElement>) => {
      setOpen(true)
    },
    handleClose = () => {
      setOpen(false)
    },
    handleThemeChange = (themeType: ThemeType) => () => {
      settingsClient.changeSettings({ themeType })
      // dispatch(sharedAppActions.setTheme(theme))
      handleClose()
    },
    menu = useAppMainMenuDataItems()

  useElectronContextMenu(menu, open, handleClose)

  return (
    <>
      <AppMainMenuButton
        color="inherit"
        ref={elem => {
          anchorRef.current = elem
        }}
        id="main-menu-button"
        aria-controls="main-menu"
        aria-haspopup="true"
        aria-expanded={open ? "true" : undefined}
        onClick={handleClick}
        size="small"
      >
        {!isElectron ? (
          <Logo
            //mode="mark-only"
            color="white"
            sx={{
              ...FlexAuto,
              flexGrow: 0,
              justifySelf: "stretch",
              alignSelf: "stretch"
            }}
          />
        ) : (
          <AppIcon
            fa
            icon={falBars}
          />
        )}
      </AppMainMenuButton>

      {!isElectron && (
        <PopoverMenu
          id="main-menu"
          anchorRef={anchorRef}
          open={open}
          placement="bottom"
          arrow
        >
          <ClickAwayListener onClickAway={handleClose}>
            <AppMainMenuList
              dense
              className={mainMenuListClasses.root}
            >
              <NestedMenuItem
                label="View"
                parentMenuOpen={open}
              >
                <NestedMenuItem
                  label="Theme"
                  parentMenuOpen={open}
                >
                  <MenuItem onClick={handleThemeChange(ThemeType.LIGHT)}>
                    <ListItemText disableTypography>Light</ListItemText>
                  </MenuItem>
                  <MenuItem onClick={handleThemeChange(ThemeType.DARK)}>
                    <ListItemText disableTypography>Dark</ListItemText>
                  </MenuItem>
                </NestedMenuItem>
              </NestedMenuItem>
              <MenuDivider />
              <MenuItem
                onClick={handleClose}
                component={RouterLink}
                to="/settings"
              >
                <ListItemText disableTypography>Settings</ListItemText>
              </MenuItem>
              <MenuDivider />
              <MenuItem
                onClick={handleClose}
                component={RouterLink}
                to="/"
              >
                <ListItemText disableTypography>Home</ListItemText>
              </MenuItem>
            </AppMainMenuList>
          </ClickAwayListener>
        </PopoverMenu>
      )}
    </>
  )
}

export default AppMainMenu
