import { Box, FormControl, styled } from "@mui/material"
import * as React from "react"
import { FormContainer, FormContent, formContentClasses } from "../../../components/form"
import { Fill, FlexColumnCenter, FlexDefaults, FlexScaleZero, hasCls } from "@vrkit-platform/shared-ui"
import { lighten } from "@mui/material/styles"
import Switch from "@mui/material/Switch"
import { SettingsDivider } from "../components/SettingsDivider"
import { SettingsLabel } from "../components/SettingsLabel"
import { useService } from "../../../components/service-container"
import { useAppSelector } from "../../../services/store"
import { sharedAppSelectors } from "../../../services/store/slices/shared-app"

import { AppSettingBoolKey, AppSettingsKey, stopEvent } from "@vrkit-platform/shared"
import { AppSettingsClient } from "../../../services/app-settings-client"
import { getLogger } from "@3fv/logger-proxy"

const log = getLogger(__filename)

export interface GeneralSettingsPanelProps {}

const GeneralFormContainer = styled(FormContainer, {
  name: "GeneralFormContainer"
})(({ theme }) => ({
  ...Fill,
  ...FlexColumnCenter
}))

const GeneralFormContent = styled(FormContent, {
  name: "GeneralFormContent"
})(({ theme }) => ({
  [hasCls(formContentClasses.root)]: {
    [`& > .${formContentClasses.scroller}`]: {
      ...FlexScaleZero,
      ...FlexDefaults.stretch,
      ...FlexDefaults.stretchSelf, // justifyContent: "center",
      [`& > .${formContentClasses.content}`]: {
        // alignItems: "center",
        ...FlexColumnCenter,
        flex: "1 0 auto",
        "& span.MuiRadio-root.MuiRadio-colorPrimary:hover": {
          backgroundColor: "transparent",
          "& > img": {
            border: `0.3rem solid ${lighten(theme.palette.action.active, 0.25)}`
          }
        },
        "& img": {
          borderRadius: "1rem",
          border: `0.3rem solid transparent`,
          transition: theme.transitions.create("border"),
          "&.checked": {
            border: `0.3rem solid ${theme.palette.action.active}`
          }
        }
      }
    }
  }
}))

export function GeneralSettingsPanel(_props: GeneralSettingsPanelProps) {
  const appSettings = useAppSelector(sharedAppSelectors.selectAppSettings),
    appSettingsClient = useService(AppSettingsClient),
    newHandleSwitch =
      <K extends AppSettingsKey>(settingKey: AppSettingBoolKey<K>) =>
      (e: React.ChangeEvent) => {
        stopEvent(e)
        appSettingsClient.changeSettings({ [settingKey]: !appSettings[settingKey] })
      }

  return (
    <GeneralFormContainer>
      <GeneralFormContent
        flexGrow={1}
        contentProps={{
          alignSelf: "center"
        }}
      >
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "min(20vw,150px) auto",
            columnGap: "3rem",
            rowGap: "4rem",
            justifyContent: "center",
            alignItems: "center"
          }}
        >
          {/* THEME */}
          <SettingsLabel>Start with PC</SettingsLabel>
          <FormControl>
            <Switch
              checked={appSettings.openAppOnBoot}
              aria-labelledby="general-open-app-on-boot"
              onChange={newHandleSwitch("openAppOnBoot")}
              name="general-open-app-on-boot"
              sx={{ gap: 8 }}
            />
          </FormControl>

          {/* TEXT SIZE (Electron ONLY) */}
          <SettingsDivider />
          <SettingsLabel>Auto Open Dash</SettingsLabel>
          <FormControl>
            <Switch
              checked={appSettings.openDashboardOnLaunch}
              aria-labelledby="general-open-dash-on-launch"
              onChange={newHandleSwitch("openDashboardOnLaunch")}
              name="general-open-dash-on-launch"
              sx={{ gap: 8 }}
            />
          </FormControl>
        </Box>
      </GeneralFormContent>
    </GeneralFormContainer>
  )
}
