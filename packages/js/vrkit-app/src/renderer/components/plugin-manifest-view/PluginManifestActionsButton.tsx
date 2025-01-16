import ButtonGroup, { buttonGroupClasses as muiButtonGroupClasses } from "@mui/material/ButtonGroup"
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown"
import { PluginInstall, PluginManifest } from "@vrkit-platform/models"
import Semver from "semver"
import {
  arrayOf,
  isEmpty,
  isNotEmptyString, stopEvent
} from "@vrkit-platform/shared"
import Button from "@mui/material/Button"
import { capitalize } from "lodash"
import { useEffect, useLayoutEffect, useRef, useState } from "react"
import useMounted from "../../hooks/useMounted"
import Popper from "@mui/material/Popper"
import Grow from "@mui/material/Grow"
import Paper from "@mui/material/Paper"
import ClickAwayListener from "@mui/material/ClickAwayListener"
import MenuList from "@mui/material/MenuList"
import MenuItem from "@mui/material/MenuItem"
import { useTheme } from "@mui/material/styles"
import { padding } from "@vrkit-platform/shared-ui"
import { PluginManagerClient } from "../../services/plugin-manager-client"
import { match } from "ts-pattern"
import { getLogger } from "@3fv/logger-proxy"
import { Alert } from "../../services/alerts"

const log = getLogger(__filename)

export enum PluginManifestAction {
  none = "none",
  install = "install",
  update = "update",
  uninstall = "uninstall",
  development = "development"
}

export type PluginManifestActionKind = `${PluginManifestAction}`

export function getPluginManifestActionLabel(action: PluginManifestActionKind) {
  return match(action)
    .with(PluginManifestAction.development, () => "Local Development Mode")
    .otherwise(it => capitalize(it))
}

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
    if (installedPlugin.isDevEnabled || installedPlugin.isLink) {
      return ["development"]
    }
    
    if (installedPlugin.isInternal) {
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

export function createPluginManifestActionHandler(pluginManagerClient: PluginManagerClient, id: string = null) {
  return async (action: PluginManifestActionKind, idOverride: string = null) => {
    try {
      if (isNotEmptyString(idOverride)) {
        id = idOverride
      }
      
      if (!id || isEmpty(id)) {
        Alert.error(`ID (${id}) is invalid, can not complete plugin action (${action})`)
        return
      }
      
      await match(action)
          .with("update", () => pluginManagerClient.updatePlugin(id))
          .with("install", () => pluginManagerClient.installPlugin(id))
          .with("uninstall", () => pluginManagerClient.uninstallPlugin(id))
          .with("development", () => {
            Alert.warning(
                "This plugin is setup for local development, any actions will have to be done manually.")
            return Promise.resolve()
          })
          .otherwise(() => Promise.reject(Error(`Unsupported action (${action})`)))
      
      log.info(`Plugin action finished (${action})`)
    } catch (err) {
      Alert.error(`Plugin action ${action} was unsuccessful: ${err?.message}`, {
      })
    }
  }
}

export interface PluginManifestActionsButtonProps {
  className?: string

  actions: PluginManifestActionKind | PluginManifestActionKind[]

  onAction: (action: PluginManifestActionKind) => any

  id?: string
}

export function PluginManifestActionsButton({
  className,
  onAction,
  actions: inActions,
  id: inId = "plugin-manifest-action-button",
  ...other
}: PluginManifestActionsButtonProps) {
  const isMounted = useMounted(),
    idRef = useRef<string>(null)

  useLayoutEffect(() => {
    if (!idRef.current) {
      const elems = document.querySelectorAll(`#${inId}`)
      idRef.current = `${inId}-${elems.length + 1}`
    }
  }, [isMounted])

  const id = idRef.current,
    theme = useTheme(),
    actions = arrayOf(inActions),
    [current, setCurrent] = useState<PluginManifestActionKind>(null),
    [open, setOpen] = useState(false),
    anchorRef = useRef<HTMLDivElement>(null),
      isDevMode = actions.includes("development"),
    handleMenuItemClick = (event: React.MouseEvent<HTMLLIElement, MouseEvent>, index: number) => {
      if (!isDevMode)
        setCurrent(actions[index])
      setOpen(false)
    },
    handleToggle = () => {
      setOpen(prevOpen => !isDevMode && !prevOpen)
    },
    handleClose = (event: Event) => {
      if (anchorRef.current && anchorRef.current.contains(event.target as HTMLElement)) {
        return
      }
      
      setOpen(false)
    }
    
  useEffect(() => {
    setCurrent(isDevMode ? "development" : actions[0])
  }, [actions[0]])

  return (
    <>
      <ButtonGroup
        className={className}
        variant="contained"
        color={isDevMode ? "error" : "primary"}
        ref={anchorRef}
        aria-label="Available plugin actions"
      >
        <Button
          size="small"
          data-action={current}
          onClick={ev => {
            stopEvent(ev)
            if (isDevMode) {
              Alert.warning(
                `No plugin actions can be used with a plugin configured to use dev mode.  You have locally installed this plugin either by a symbolic link or by manually copying it to the plugins folder.`
              )
            } else {
              onAction(current)
            }
          }}
        >
          {capitalize(current)}
        </Button>
        {actions.length > 1 && (
          <Button
            size="small"
            aria-controls={!isDevMode && open ? id : undefined}
            aria-expanded={!isDevMode && open ? "true" : undefined}
            aria-label="Select alternative action"
            aria-haspopup="menu"
            sx={{
              ...padding(theme.spacing(1.5), theme.spacing(0.5)),
              [`&.${muiButtonGroupClasses.grouped}`]: {
                minWidth: 0,
                width: "auto"
              }
            }}
            onClick={handleToggle}
          >
            <ArrowDropDownIcon />
          </Button>
        )}
      </ButtonGroup>
      {actions.length > 1 && (
        <Popper
          sx={{
            zIndex: 1
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
                transformOrigin: placement === "bottom" ? "center top" : "center bottom"
              }}
            >
              <Paper>
                <ClickAwayListener onClickAway={handleClose}>
                  <MenuList
                    id={id}
                    autoFocusItem
                  >
                    {actions
                      // .filter(action => action !== current)
                      .map((action, index) => (
                        <MenuItem
                          key={action}
                          selected={action === current}
                          onClick={event => handleMenuItemClick(event, index)}
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
      )}
    </>
  )
}

export default PluginManifestActionsButton
