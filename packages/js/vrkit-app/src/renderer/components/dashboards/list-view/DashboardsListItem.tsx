// REACT
import React, { useCallback, useMemo } from "react"

// CLSX
// 3FV
import { getLogger } from "@3fv/logger-proxy"

import type { BoxProps } from "@mui/material/Box"
// MUI
import Box from "@mui/material/Box"
import { useTheme } from "@mui/material/styles"
import clsx from "clsx"
import { AppFAIcon, AppIcon } from "../../app-icon"
import { DashboardConfig, PluginComponentDefinition, Timestamp } from "vrkit-models"
import { useService } from "../../service-container"
import { DashboardManagerClient } from "../../../services/dashboard-manager-client"
import { AppSettingsClient } from "../../../services/app-settings-client"
import { useAppSelector } from "../../../services/store"
import { sharedAppSelectors } from "../../../services/store/slices/shared-app"
import { decodeSvgFromUri, hasProp, isNotEmpty, isNotEmptyString, isSvgUri, propEqualTo } from "vrkit-shared"
import Alerts from "../../../services/alerts"
import {
  alpha,
  dimensionConstraints,
  Ellipsis,
  EllipsisBox,
  flexAlign,
  FlexAuto,
  FlexAutoBox,
  FlexColumnBox,
  FlexColumnCenterBox,
  FlexRow,
  FlexRowBox,
  FlexRowCenterBox,
  FlexScaleZero,
  FlexScaleZeroBox,
  OverflowHidden,
  padding,
  rem
} from "vrkit-shared-ui"

import Paper from "@mui/material/Paper"
import Typography from "@mui/material/Typography"
import { asOption } from "@3fv/prelude-ts"
import { NavLink } from "react-router-dom"
import { WebPaths } from "../../../routes/WebPaths"
import ButtonBase, { ButtonBaseProps } from "@mui/material/ButtonBase"
import AddIcon from "@mui/icons-material/Add"
import IconButton, { IconButtonProps } from "@mui/material/IconButton"
import { faEdit, faEllipsisVertical, faRocketLaunch, faTrash } from "@awesome.me/kit-79150a3eed/icons/sharp/solid"
import Tooltip from "@mui/material/Tooltip"
import { Divider, Menu } from "@mui/material"
import MenuItem from "@mui/material/MenuItem"
import { faGridHorizontal } from "@awesome.me/kit-79150a3eed/icons/duotone/solid"
import { get } from "lodash/fp"
import { noop, range } from "lodash"
import Moment from "react-moment"
import { dashboardsListViewClasses } from "./DashboardsListView"
import { isDefined } from "@3fv/guard"
import AppIconButton from "../../app-icon-button"

const log = getLogger(__filename)
const { info, debug, warn, error } = log

const ListItemVisiblePluginMaxCount = 3

interface PluginOverlayIconProps extends Omit<BoxProps, "component"> {
  component?: PluginComponentDefinition

  moreCount?: number
}

function PluginOverlayIcon({ component = null, moreCount = 0, sx: providedSx = {}, ...other }: PluginOverlayIconProps) {
  const theme = useTheme(),
    uiRes = component?.uiResource,
    uiIcon = uiRes?.icon,
    color = alpha(theme.palette.text.primary, 0.7),
    iconHtml = asOption(uiIcon)
      .filter(hasProp("url"))
      .filter(propEqualTo("isDataUrl", true))
      .map(get("url"))
      .filter(isSvgUri)
      .map(decodeSvgFromUri)
      .filter(isNotEmpty)
      .getOrNull(),
    sx = {
      ...FlexAuto,
      ...padding(0, theme.spacing(0.25)),
      ...dimensionConstraints(theme.dimen.appIconSizes[2]),
      fill: color,
      color,
      ...providedSx
    } as any

  return moreCount > 0 ? (
    <FlexRowCenterBox
      sx={sx}
      {...other}
    >
      +{moreCount}
    </FlexRowCenterBox>
  ) : iconHtml ? (
    <FlexRowCenterBox
      sx={sx}
      dangerouslySetInnerHTML={{ __html: iconHtml }}
      {...other}
    />
  ) : (
    <></>
  )
}

interface DashboardsListItemMenuProps extends Omit<IconButtonProps, "onClick"> {
  config: DashboardConfig

  disabled?: boolean

  isDefault: boolean

  onDelete: () => any

  onSetAsDefault: () => any
}

function DashboardsListItemMenu({
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

  return (
    <>
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

/**
 * Props for list item
 */
export interface DashboardsListItemProps extends Omit<BoxProps, "onClick"> {
  config: DashboardConfig
  paperClassName?: string
}

/**
 * Dashboard Config List item
 *
 * @param props
 * @constructor
 */
export function DashboardsListItem(props: DashboardsListItemProps) {
  const theme = useTheme(),
    { className, paperClassName, config, ...other } = props,
    dashClient = useService(DashboardManagerClient),
    settingsClient = useService(AppSettingsClient),
    defaultId = asOption(useAppSelector(sharedAppSelectors.selectDefaultDashboardConfigId))
      .filter(isNotEmptyString)
      .getOrNull(),
    isDefault = defaultId === config?.id,
    activeId = asOption(useAppSelector(sharedAppSelectors.selectActiveDashboardConfigId))
      .filter(isNotEmptyString)
      .getOrNull(),
    isActive = activeId === config?.id,
    hasActive = !!activeId,
    allOverlayDefMap = useAppSelector(sharedAppSelectors.selectAllPluginComponentOverlayDefsMap),
    overlayIds = useMemo(() => {
      return (config?.overlays ?? []).map(get("componentId"))
    }, [allOverlayDefMap, config?.overlays]),
    overlayDefs = useMemo(() => {
      return overlayIds.map(overlayId => allOverlayDefMap[overlayId]).filter(isDefined) as PluginComponentDefinition[]
    }, [allOverlayDefMap, overlayIds]),
    visibleOverlayDefCount = Math.min(ListItemVisiblePluginMaxCount, overlayDefs.length),
    moreOverlayDefCount = Math.max(0, overlayDefs.length - ListItemVisiblePluginMaxCount),
    pluginIcons = range(0, visibleOverlayDefCount)
      .map(idx => overlayDefs[idx] as PluginComponentDefinition)
      .filter(isDefined)
      .map(component => {
        log.info(`Creating component icon`, component.id)
        return (
          <PluginOverlayIcon
            key={component.id}
            component={component}
          />
        )
      }),
    handleSetAsDefault = useCallback(() => {
      if (!isNotEmptyString(config?.id)) {
        Alerts.onError(`Can not delete dashboard config, id is invalid`)
        return
      }

      if (isDefault) {
        Alerts.onError(`This dashboard is already the default`)
      } else {
        settingsClient.changeSettings({
          defaultDashboardConfigId: config.id
        })
      }
    }, [config?.id, hasActive, dashClient]),
    handleDelete = useCallback(() => {
      if (!isNotEmptyString(config?.id)) {
        Alerts.onError(`Can not delete dashboard config, id is invalid`)
        return
      }

      if (activeId === config.id) {
        Alerts.onError(`Dashboard is currently active, please close it before deleting`)
      } else {
        dashClient.deleteDashboardConfig(config.id)
      }
    }, [config?.id, hasActive, dashClient]),
    toggleOpen = useCallback(() => {
      if (hasActive) {
        dashClient.closeDashboard()
      } else if (isNotEmpty(config?.id)) {
        dashClient.openDashboard(config.id)
      } else {
        Alerts.onError(`No dashboard ID available`)
      }
    }, [config?.id, hasActive, dashClient])

  return (
    <Box
      className={clsx(dashboardsListViewClasses.item, className)}
      {...other}
    >
      <Paper
        className={clsx(dashboardsListViewClasses.itemPaper, {
          [dashboardsListViewClasses.itemIsDefault]: isDefault,
          [dashboardsListViewClasses.itemIsOpen]: isActive
        },paperClassName)}
      >
        <FlexRowBox
          sx={{
            ...FlexAuto,
            ...OverflowHidden,
            ...flexAlign("stretch", "stretch"),
            ...padding(theme.spacing(1), theme.spacing(1), theme.spacing(0.25), theme.spacing(1)),
            gap: theme.spacing(1)
          }}
        >
          <AppIcon
            elevation={4}
            variant="circle"
            size="xl"
            icon={"Alien"}
            sx={{ ...FlexAuto }}
          />

          <FlexColumnBox
            sx={{
              ...FlexScaleZero,
              ...OverflowHidden,
              ...flexAlign("stretch", "stretch"),
              ...padding(0, `0.5rem`, 0, 0)
            }}
          >
            <Typography
              sx={{
                ...FlexAuto,
                ...Ellipsis
              }}
              variant="body1"
            >
              {config.name}
            </Typography>

            <Typography
              variant="caption"
              sx={{
                color: alpha(theme.palette.text.primary, 0.5)
              }}
            >
              {asOption(config.description).filter(isNotEmpty).getOrElse("No notes")}
            </Typography>
          </FlexColumnBox>
          <FlexRowCenterBox>
            <AppIconButton
                tooltip="Edit"
                className={clsx(dashboardsListViewClasses.itemAction)}
                component={NavLink}
                to={WebPaths.app.dashboards + `/${config?.id}/edit`}
              >
                <AppFAIcon
                  size="2xs"
                  icon={faEdit}
                />
            </AppIconButton>
            <AppIconButton
              tooltip="Launch dashboard"
              className={clsx(dashboardsListViewClasses.itemAction)}
              onClick={toggleOpen}
            >
              <AppFAIcon
                size="2xs"
                icon={faRocketLaunch}
              />
            </AppIconButton>

            <DashboardsListItemMenu
              config={config}
              onDelete={handleDelete}
              onSetAsDefault={handleSetAsDefault}
              isDefault={isDefault}
            />
          </FlexRowCenterBox>
        </FlexRowBox>

        <FlexScaleZeroBox />

        <FlexRowBox
          sx={{
            ...padding(theme.spacing(1), theme.spacing(1), theme.spacing(1), theme.spacing(1)),
            gap: theme.spacing(1),
            background: theme.palette.background.actionFooter
          }}
        >
          <Tooltip title="Dashboard includes these plugins">
          <FlexRowCenterBox sx={{ ...FlexAuto }}>
            <Typography variant="caption">&nbsp;</Typography>
            {pluginIcons}
            <PluginOverlayIcon moreCount={moreOverlayDefCount} />
          </FlexRowCenterBox>
          </Tooltip>
          <EllipsisBox
            variant="caption"
            sx={{
              ...FlexRow,
              ...FlexScaleZero,
              ...flexAlign("center", "flex-end"), // fontStyle: "italic",
              fontSize: rem(0.5),
              opacity: 0.35
            }}
          >
            modified&nbsp;
            <Moment
              fromNow
              date={Timestamp.toDate(config.fileInfo.modifiedAt)}
            />
          </EllipsisBox>
          {/*<FlexScaleZeroBox />*/}
          {isDefault && <FlexAutoBox className={clsx(dashboardsListViewClasses.itemDefaultBadge)}>DEFAULT</FlexAutoBox>}
        </FlexRowBox>
      </Paper>
    </Box>
  )
}

export interface DashboardsListItemCreateProps extends Omit<BoxProps, "onClick"> {
  onClick: ButtonBaseProps["onClick"]
}

export function DashboardsListItemCreate(props: DashboardsListItemCreateProps) {
  const theme = useTheme(),
    { className, onClick, ...other } = props

  return (
    <Box className={clsx(dashboardsListViewClasses.item, className)}>
      <Paper
        component={ButtonBase}
        onClick={onClick}
        elevation={4}
        className={clsx(dashboardsListViewClasses.itemPaper, dashboardsListViewClasses.itemCreateButton)}
      >
        <FlexColumnCenterBox
          sx={{
            ...padding(`0.5rem`),
            gap: theme.spacing(1)
          }}
        >
          <AddIcon />
          <Typography
            variant="body1"
            sx={{
              color: alpha(theme.palette.text.primary, 0.5)
            }}
          >
            Create
          </Typography>
        </FlexColumnCenterBox>
        {/*</FlexRowBox>*/}
      </Paper>
    </Box>
  )
}
