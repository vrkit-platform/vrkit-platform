// REACT
import React, { useCallback, useMemo } from "react"

// CLSX
// 3FV
import { getLogger } from "@3fv/logger-proxy"

// MUI
import Box from "@mui/material/Box"
import { styled, useTheme } from "@mui/material/styles"
import { asOption } from "@3fv/prelude-ts"
import { get } from "lodash/fp"
import { range } from "lodash"
import { isDefined } from "@3fv/guard"

import { Page, PageProps } from "../../components/page"

import clsx from "clsx"

import {
  child,
  dimensionConstraints,
  Ellipsis,
  Fill,
  flexAlign,
  FlexAuto,
  FlexColumn,
  FlexRow,
  FlexRowCenter,
  FlexScaleZero,
  margin,
  OverflowAuto,
  OverflowHidden,
  padding,
  PositionRelative,
  rem
} from "@vrkit-platform/shared-ui"

import classes from "./DashboardControllerPageClasses"
import OpenLayoutEditorIcon from '@mui/icons-material/SpaceDashboard'
import DashboardIcon from '@mui/icons-material/Dashboard'
import ButtonGroup from "@mui/material/ButtonGroup"
import Button from "@mui/material/Button"
import { useService } from "../../components/service-container"
import { DashboardManagerClient } from "../../services/dashboard-manager-client"
import { AppSettingsClient } from "../../services/app-settings-client"
import { useAppSelector } from "../../services/store"
import { PluginCompEntry, sharedAppSelectors } from "../../services/store/slices/shared-app"
import { isNotEmpty, isNotEmptyString } from "@vrkit-platform/shared"
import { PluginOverlayIcon } from "../../components/plugins"
import Alerts, { Alert } from "../../services/alerts/Alerts"
import {
  DashboardOverlayListItemMaxVisiblePluginCount
} from "../../components/dashboards/list-view"
import AppIconButton from "../../components/app-icon-button"

const log = getLogger(__filename)
const { info, debug, warn, error } = log

const DashboardControllerPageRoot = styled(Box, {
  name: "DashboardControllerPageRoot"
})(({ theme }) => ({
  ...PositionRelative,
  ...FlexScaleZero,
  ...OverflowHidden,
  ...FlexColumn,
  ...flexAlign("stretch", "stretch"),
  [child(classes.header)]: {
    ...FlexColumn,
    ...FlexAuto,
    ...flexAlign("stretch", "center"),
    ...padding(theme.spacing(2), theme.spacing(4)),
    [child(classes.headerInstructions)]: {
      ...FlexRowCenter,
      ...theme.typography.h3,
      fontWeight: 100,
      opacity: 0.5,
      textAlign: "center"
    },
    [child(classes.headerButtons)]: {
      ...FlexRowCenter,
      [child(classes.headerButton)]: {
        ...PositionRelative,
        ...dimensionConstraints(rem(4)),
        ...padding(theme.spacing(2)),
        ...margin(0),
        "& > svg": {
          ...Fill,
          color:theme.palette.primary.contrastText
        }
      }
    }
  },
  [child(classes.overlays)]: {
    ...PositionRelative,
    ...FlexColumn,
    ...FlexScaleZero,
    ...flexAlign("stretch", "stretch"),
    ...OverflowAuto,
    [child(classes.overlayRow)]: {
      ...FlexRow,
      ...OverflowHidden,
      borderRadius: theme.shape.borderRadius,

      [child(classes.overlayDetails)]: {
        ...Ellipsis,
        ...FlexScaleZero,
        ...OverflowHidden,
        [child(classes.overlayActions)]: {
          ...FlexRowCenter,
          ...FlexAuto,
          ...OverflowHidden,
          ...padding(theme.spacing(0.25), theme.spacing(0.5)),
          gap: theme.spacing(1),
          [child(classes.overlayAction)]: {
            ...OverflowHidden,
            ...FlexRowCenter,
            ...FlexAuto
          }
        }
      }
    }
  }
}))

export interface DashboardControllerPageProps extends PageProps {}

export function DashboardControllerPage(props: DashboardControllerPageProps) {
  const theme = useTheme(),
      { className,  ...other } = props,
      config = useAppSelector(sharedAppSelectors.selectActiveDashboardConfig),
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
      visibleOverlayDefCount = Math.min(DashboardOverlayListItemMaxVisiblePluginCount, overlayDefs.length),
      moreOverlayDefCount = Math.max(0, overlayDefs.length - DashboardOverlayListItemMaxVisiblePluginCount),
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
      editLayout = Alert.usePromise(async () => {
        const idValid = isNotEmpty(config?.id)
        if (!idValid) {
          Alerts.onError(!idValid ? `Dashboard ID is invalid` : `Dashboard must be open in order to edit the layout`)
          return
        }
        
        if (!isActive) {
          if (hasActive) {
            info(`Closing active dashboard in order to start layout editor for ${config.id}`)
            await dashClient.closeDashboard()
          }
          info(`Launching dashboard to start layout editor for ${config.id}`)
          await dashClient.openDashboard(config.id)
        }
        info(`Launching dashboard to start layout editor for ${config.id}`)
        await dashClient.launchLayoutEditor(config.id)
      }, {
        loading: ctx => `Launching layout editor for dashboard (${config.name})`,
        error: (ctx) => {
          log.error(`Failed to launch layout editor for dashboard ${config.id}`, ctx)
          return `Unable to launch layout editor: ${ctx.err?.message}`
        },
        success: () => `Launch dashboard layout editor`
      },[config?.id, isActive, hasActive, dashClient])
  
  return (
    <Page
      metadata={{
        title: "Dash Controller",
        appTitlebar: {
          lightsEnabled: {
            maximize: false
          }
        }
      }}
    >
      <DashboardControllerPageRoot className={clsx(className)}>
        <Box className={classes.header}>
          {/*<Box className={classes.headerInstructions}>*/}
          {/*  Manage your dashboard from this window.*/}
          {/*</Box>*/}
          <Box className={classes.headerButtons}>
            {/*<AppIconButton*/}
            {/*    tooltip={"Layout Editor"}*/}
            {/*    size="large"*/}
            {/*    variant="contained"*/}
            {/*    color="primary"*/}
            {/*    className={clsx(classes.headerButton)}*/}
            {/*    onClick={editLayout.execute}*/}
            {/*>*/}
            {/*  <OpenLayoutEditorIcon />*/}
            {/*</AppIconButton>*/}
            {/*<ButtonGroup>*/}
            {/*  <Button onClick={editLayout.execute}>*/}
            {/*    Launch VR Layout Editor*/}
            {/*  </Button>    */}
            {/*</ButtonGroup>*/}
            <Button
                size="large"
                variant="contained"
                color="primary"
                className={clsx(classes.headerButton)}
                onClick={editLayout.execute}
            >
              <OpenLayoutEditorIcon />
            </Button>
          </Box>
        </Box>
        <Box className={classes.overlays}></Box>
      </DashboardControllerPageRoot>
    </Page>
  )
}

export default DashboardControllerPage
