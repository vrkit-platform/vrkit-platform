import ButtonGroup, { buttonGroupClasses as muiButtonGroupClasses, ButtonGroupProps } from "@mui/material/ButtonGroup"
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown"
import { PluginInstall, PluginManifest } from "@vrkit-platform/models"
import Semver from "semver"
import { arrayOf } from "@vrkit-platform/shared"
import Button from "@mui/material/Button"
import { capitalize } from "lodash"
import { useLayoutEffect, useRef, useState } from "react"
import useMounted from "../../hooks/useMounted"
import Popper from "@mui/material/Popper"
import Grow from "@mui/material/Grow"
import Paper from "@mui/material/Paper"
import ClickAwayListener from "@mui/material/ClickAwayListener"
import MenuList from "@mui/material/MenuList"
import MenuItem from "@mui/material/MenuItem"
import { useTheme } from "@mui/material/styles"
import { padding } from "@vrkit-platform/shared-ui"

export enum PluginManifestAction {
  none = "none",
  install = "install",
  update = "update",
  uninstall = "uninstall"
}

export type PluginManifestActionKind = `${PluginManifestAction}`

/**
 * Get available plugin actions based on installation details (if installed)
 *
 * @param installedPluginMap
 * @param manifest
 */
export function getPluginActions(
  installedPluginMap: Record<string, PluginInstall>,
  manifest: PluginManifest
): PluginManifestActionKind[] {
  const actions = Array<PluginManifestActionKind>(),
    installedPlugin = installedPluginMap[manifest?.id],
      installedManifest = installedPlugin?.manifest

  if (!!installedManifest) {
    if (installedPlugin.isInternal || installedPlugin.isLink) {
      return ["none"]
    }

    if (Semver.lt(installedManifest.version, manifest.version)) {
      actions.push("update")
    }

    actions.push("uninstall")
  } else {
    actions.push("install")
  }

  return actions
}

/**
 * Get the primary/first available action
 *
 * @param installedPluginMap
 * @param manifest
 */
export function getPluginPrimaryAction(installedPluginMap: Record<string, PluginInstall>, manifest: PluginManifest) {
  return getPluginActions(installedPluginMap, manifest)[0] ?? "none"
}

export interface PluginManifestActionsButtonProps extends ButtonGroupProps {
  actions: PluginManifestActionKind | PluginManifestActionKind[]
}

export function PluginManifestActionsButton({ id:inId = "plugin-manifest-action-button", actions: inActions, ...other }: PluginManifestActionsButtonProps) {
  const
      isMounted = useMounted(),
      idRef = useRef<string>(null)
  
  useLayoutEffect(() => {
    if (!idRef.current) {
      const elems = document.querySelectorAll(`#${inId}`)
      idRef.current = `${inId}-${elems.length + 1}`
    }
  }, [isMounted])
  
  
  const
      id = idRef.current,
      theme = useTheme(),
      actions = arrayOf(inActions),
    [current, setCurrent] = useState<PluginManifestActionKind>(actions[0]),
    [open, setOpen] = useState(false),
    anchorRef = useRef<HTMLDivElement>(null),
    handleMenuItemClick = (event: React.MouseEvent<HTMLLIElement, MouseEvent>, index: number) => {
      setCurrent(actions[index])
      setOpen(false)
    },
    handleToggle = () => {
      setOpen(prevOpen => !prevOpen)
    },
    handleClose = (event: Event) => {
      if (anchorRef.current && anchorRef.current.contains(event.target as HTMLElement)) {
        return
      }

      setOpen(false)
    }

  // TODO: Add custom secondary actions control
  return !id ? null : (
    <>
      <ButtonGroup
        variant="contained"
        color="primary"
        ref={anchorRef}
        aria-label="Available plugin actions"
      >
        <Button
          // color="primary"
          size="small"
          data-action={current}
        >
          {capitalize(current)}
        </Button>
        <Button
          size="small"
          aria-controls={open ? id : undefined}
          aria-expanded={open ? "true" : undefined}
          aria-label="Select alternative action"
          aria-haspopup="menu"
          sx={{
            ...padding(theme.spacing(1.5),theme.spacing(0.5)),
            [`&.${muiButtonGroupClasses.grouped}`]: {
              minWidth: 0, width: "auto"
            }
          }}
          onClick={handleToggle}
        >
          <ArrowDropDownIcon />
        </Button>
      </ButtonGroup>
      <Popper
          sx={{
            zIndex: 1,
          }}
          open={open}
          anchorEl={anchorRef.current}
          role={undefined}
          transition
          disablePortal
      >
        {({ TransitionProps, placement }) => (
            <Grow
                {...TransitionProps}
                style={{
                  transformOrigin:
                      placement === 'bottom' ? 'center top' : 'center bottom',
                }}
            >
              <Paper>
                <ClickAwayListener onClickAway={handleClose}>
                  <MenuList id={id} autoFocusItem>
                    {actions
                        // .filter(action => action !== current)
                        .map((action, index) => (
                        <MenuItem
                            key={action}
                            selected={action === current}
                            onClick={(event) => handleMenuItemClick(event, index)}
                        >
                          {capitalize(action)}
                        </MenuItem>
                    ))}
                  </MenuList>
                </ClickAwayListener>
              </Paper>
            </Grow>
        )}
      </Popper>
    </>
  )
}

export default PluginManifestActionsButton