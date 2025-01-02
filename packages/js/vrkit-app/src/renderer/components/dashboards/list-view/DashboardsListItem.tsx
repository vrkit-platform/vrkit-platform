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
import { DashboardConfig, Timestamp } from "@vrkit-platform/models"
import { useService } from "../../service-container"
import { DashboardManagerClient } from "../../../services/dashboard-manager-client"
import { AppSettingsClient } from "../../../services/app-settings-client"
import { useAppSelector } from "../../../services/store"
import { PluginCompEntry, sharedAppSelectors } from "../../../services/store/slices/shared-app"
import { isNotEmpty, isNotEmptyString } from "@vrkit-platform/shared"
import Alerts from "../../../services/alerts"
import {
  Ellipsis,
  EllipsisBox,
  flexAlign,
  FlexAuto,
  FlexAutoBox,
  FlexColumnBox,
  FlexRow,
  FlexRowBox,
  FlexRowCenter,
  FlexRowCenterBox,
  FlexScaleZero,
  FlexScaleZeroBox,
  OverflowHidden,
  padding,
  rem
} from "@vrkit-platform/shared-ui"

import Paper from "@mui/material/Paper"
import Typography from "@mui/material/Typography"
import { asOption } from "@3fv/prelude-ts"
import { NavLink } from "react-router-dom"
import { WebPaths } from "../../../routes/WebPaths"
import AddIcon from "@mui/icons-material/Add"
import { faEdit, faRocketLaunch } from "@awesome.me/kit-79150a3eed/icons/sharp/solid"
import Tooltip from "@mui/material/Tooltip"
import Button, { ButtonProps } from "@mui/material/Button"
import { get } from "lodash/fp"
import { range } from "lodash"
import Moment from "react-moment"
import { dashboardsListViewClasses as classNames } from "./DashboardsListView"
import { isDefined } from "@3fv/guard"
import AppIconButton from "../../app-icon-button"
import PluginOverlayIcon from "./PluginOverlayIcon"
import DashboardsListItemMenu from "./DashboardsListItemMenu"

const log = getLogger(__filename)
const { info, debug, warn, error } = log

const ListItemVisiblePluginMaxCount = 3

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
    allOverlayCompEntryMap = useAppSelector(sharedAppSelectors.selectPluginComponentOverlayDefsMap),
    compIds = useMemo(() => {
      return (config?.overlays ?? []).map(get("componentId"))
    }, [config?.overlays]),
    overlayDefs = useMemo(() => {
      return compIds.map(compId => allOverlayCompEntryMap[compId]).filter(isDefined) as PluginCompEntry[]
    }, [allOverlayCompEntryMap, compIds]),
    visibleOverlayDefCount = Math.min(ListItemVisiblePluginMaxCount, overlayDefs.length),
    moreOverlayDefCount = Math.max(0, overlayDefs.length - ListItemVisiblePluginMaxCount),
    pluginIcons = range(0, visibleOverlayDefCount)
      .map(idx => overlayDefs[idx][1])
      .filter(isDefined)
      .map(component => {
        if (log.isDebugEnabled())
          log.debug(`Creating component icon`, component.id, component)
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
      className={clsx(classNames.item, className)}
      {...other}
    >
      <Paper
        className={clsx(classNames.itemPaper, {
          [classNames.itemIsDefault]: isDefault,
          [classNames.itemIsOpen]: isActive
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
            icon={asOption(config?.uiResource?.icon?.url).getOrElse("Alien")}
            sx={{ ...FlexAuto }}
          />

          <FlexColumnBox
            sx={{
              ...FlexScaleZero,
              ...OverflowHidden,
              ...flexAlign("stretch", "stretch"),
              ...padding(0, theme.spacing(1), 0, 0)
            }}
          >
            <Typography
              sx={{
                ...FlexAuto,
                ...Ellipsis
              }}
              variant="h6"
            >
              {config.name}
            </Typography>

            <Typography
              variant="subtitle2"
            >
              {asOption(config.description).filter(isNotEmpty).getOrElse("No notes")}
            </Typography>
          </FlexColumnBox>
          <FlexRowCenterBox>
            <AppIconButton
                tooltip="Edit"
                className={clsx(classNames.itemAction)}
                component={NavLink}
                to={WebPaths.app.dashboards + `/${config?.id}`}
              >
                <AppFAIcon
                  size="2xs"
                  icon={faEdit}
                />
            </AppIconButton>
            <AppIconButton
              tooltip="Launch dashboard"
              className={clsx(classNames.itemAction)}
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
          <FlexRowCenterBox sx={{ ...FlexAuto, paddingLeft: theme.spacing(0.5), gap: theme.spacing(1) }}>
            {/*<Typography variant="caption">&nbsp;</Typography>*/}
            {pluginIcons}
            <PluginOverlayIcon moreCount={moreOverlayDefCount} />
          </FlexRowCenterBox>
          </Tooltip>
          <EllipsisBox
            variant="body2"
            sx={{
              ...FlexRow,
              ...FlexScaleZero,
              ...flexAlign("center", "flex-end"),
              opacity: 0.35
            }}
          >
            modified&nbsp;
            <Moment
              fromNow
              date={Timestamp.toDate(config.fileInfo.modifiedAt)}
            />
          </EllipsisBox>
          {isDefault && <FlexAutoBox className={clsx(classNames.itemDefaultBadge)}>DEFAULT</FlexAutoBox>}
        </FlexRowBox>
      </Paper>
    </Box>
  )
}

export interface DashboardsListItemCreateProps extends Omit<BoxProps, "onClick"> {
  onClick: ButtonProps["onClick"]
}

export function DashboardsListItemCreate(props: DashboardsListItemCreateProps) {
  const theme = useTheme(),
    { className, onClick, ...other } = props

  return (
      <Button
        color="primary"
        size="small"
        variant="contained"
        onClick={onClick}
        sx={{
          ...FlexAuto,
          ...FlexRowCenter,
          gap: theme.spacing(1)
        }}
      >
          <AddIcon />
          <span>
            Create
          </span>
      </Button>
    // </Box>
  )
}
