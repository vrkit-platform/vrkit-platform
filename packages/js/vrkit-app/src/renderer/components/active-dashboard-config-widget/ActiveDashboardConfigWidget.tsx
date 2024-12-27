// REACT
import React, { useCallback } from "react"

// CLSX
import clsx from "clsx"

// 3FV
import { getLogger } from "@3fv/logger-proxy"

import type { BoxProps } from "@mui/material/Box"
// MUI
import Box from "@mui/material/Box"
import { styled } from "@mui/material/styles"

// APP
import { borderRadius, ClassNamesKey, createClassNames, FlexAuto, FlexRowCenter } from "@vrkit-platform/shared-ui"
import { useAppSelector } from "vrkit-app-renderer/services/store"
import { sharedAppSelectors } from "vrkit-app-renderer/services/store/slices/shared-app"

import Select, { selectClasses } from "@mui/material/Select"
import MenuItem from "@mui/material/MenuItem"
import { useService } from "../service-container"
import AppSettingsClient from "../../services/app-settings-client"
import { DashboardManagerClient } from "../../services/dashboard-manager-client"
import Button from "@mui/material/Button"
import SharedAppStateClient from "../../services/shared-app-state-client"
import { OverlayManagerClient } from "../../services/overlay-manager-client"
import Checkbox from "@mui/material/Checkbox"
import Typography from "@mui/material/Typography"

const log = getLogger(__filename)
const { info, debug, warn, error } = log

const classPrefix = "activeDashboardConfigWidget"
export const activeDashboardConfigWidgetClasses = createClassNames(classPrefix, "select")
export type ActiveDashboardConfigWidgetClassKey = ClassNamesKey<typeof activeDashboardConfigWidgetClasses>

const ActiveDashboardConfigWidgetRoot = styled(Box, {
  name: "ActiveDashboardConfigWidgetRoot",
  label: "ActiveDashboardConfigWidgetRoot"
})(({ theme }) => ({
  // root styles here
  ...FlexRowCenter,
  ...FlexAuto,
  gap: "1rem",
  [`& div.${activeDashboardConfigWidgetClasses.select}`]: {
    padding: 0,
    ...borderRadius(4),
    [`& > div.${selectClasses.filled}`]: {
      paddingTop: 5,
      paddingBottom: 5
    }
  }
}))

/**
 * ActiveDashboardConfigWidget Component Properties
 */
export interface ActiveDashboardConfigWidgetProps extends BoxProps {}

/**
 * ActiveDashboardConfigWidget Component
 *
 * @param { ActiveDashboardConfigWidgetProps } props
 */
export function ActiveDashboardConfigWidget(props: ActiveDashboardConfigWidgetProps) {
  const { ...other } = props,
    configId = useAppSelector(sharedAppSelectors.selectDefaultDashboardConfigId), // activeConfig = useAppSelector(sharedAppSelectors.selectActiveDashboardConfig),
    configs = useAppSelector(sharedAppSelectors.selectDashboardConfigs),
    appSettings = useAppSelector(sharedAppSelectors.selectAppSettings),
      appSettingsClient = useService(AppSettingsClient),
    sharedAppClient = useService(SharedAppStateClient),
    overlayClient = useService(OverlayManagerClient),
    dashClient = useService(DashboardManagerClient),
    setDefaultDashboardConfigId = useCallback(
      (id: string) => {
        appSettingsClient.changeSettings({ defaultDashboardConfigId: id })
      },
      [appSettingsClient]
    ),
    hasActiveDashboard = !!useAppSelector(sharedAppSelectors.selectActiveDashboardConfigId),
    editorEnabled = useAppSelector(sharedAppSelectors.selectEditorEnabled),
    toggleDashboard = useCallback(() => {
      if (hasActiveDashboard) {
        dashClient.closeDashboard()
      } else {
        dashClient.openDashboard(configId)
      }
    }, [configId, hasActiveDashboard, dashClient]),
    toggleOverlayMode = useCallback(() => {
      overlayClient.setEditorEnabled(!editorEnabled)
    }, [overlayClient, editorEnabled])

  return (
    <ActiveDashboardConfigWidgetRoot {...other}>
      <Checkbox
          onChange={(ev) => {
            appSettingsClient.changeSettings({
              openDashboardOnLaunch: ev.target.checked // !appSettings.openDashboardOnLaunch
            })
          }}
          checked={appSettings.openDashboardOnLaunch} />
      <div>
        Auto Open
      </div>
      <Select
        className={clsx(activeDashboardConfigWidgetClasses.select)}
        disableUnderline
        variant="filled"
        color="success"
        id="selectActiveDashboardConfig"
        value={configId}
        label="Dashboard Config"
      >
        {configs.map(config => (
          <MenuItem
            key={config.id}
            onClick={() => {
              setDefaultDashboardConfigId(config.id)
            }}
            value={config.id}
          >
            {config.name}
          </MenuItem>
        ))}
      </Select>
      <Button
        variant="contained"
        color={hasActiveDashboard ? "error" : "info"}
        onClick={toggleDashboard}
      >
        {hasActiveDashboard ? "Close" : "Open"}
      </Button>
      <Button
        variant="outlined"
        disabled={!hasActiveDashboard}
        color="error"
        onClick={toggleOverlayMode}
      >
        {editorEnabled ? "Done" : "Edit"}
      </Button>
    </ActiveDashboardConfigWidgetRoot>
  )
}

export default ActiveDashboardConfigWidget
