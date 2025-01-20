import { Box, Button, Divider, FormControl, Radio, RadioGroup, styled, Typography } from "@mui/material"
import * as React from "react"
import { FormContainer, FormContent, formContentClasses } from "../../../components/form"
import ThemeAutoIcon from "assets/images/settings/theme-auto-icon.png"
import ThemeLightIcon from "assets/images/settings/theme-light-icon.png"
import ThemeDarkIcon from "assets/images/settings/theme-dark-icon.png"
import { Fill, FlexColumnCenter, FlexDefaults, FlexRowCenter, FlexScaleZero, hasCls } from "@vrkit-platform/shared-ui"
import { lighten } from "@mui/material/styles"
import Switch, { SwitchProps } from "@mui/material/Switch"
import { SettingsDivider } from "../components/SettingsDivider"
import { SettingsLabel } from "../components/SettingsLabel"
import { useService } from "../../../components/service-container"
import { useAppDispatch, useAppSelector } from "../../../services/store"
import { ZoomFactorIncrement, ZoomFactorMax, ZoomFactorMin } from "../../../../common/common-constants"
import { sharedAppSelectors } from "../../../services/store/slices/shared-app"

import { ActionRegistry, stopEvent } from "@vrkit-platform/shared"
import { AppSettingsClient } from "../../../services/app-settings-client"
import { AppSettings, ThemeType } from "@vrkit-platform/models"
import { isElectron } from "../../../renderer-constants"
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

type AppSettingsKey = keyof AppSettings

// type AppSettingsOfType<T> = AppSettings[AppSettingsKey] extends T ?

type AppSettingKeyType<K extends AppSettingsKey, T> = AppSettings[K] extends T ? K : never

type AppSettingBoolKey<K extends AppSettingsKey> = AppSettingKeyType<K,boolean>

export function GeneralSettingsPanel(_props: GeneralSettingsPanelProps) {
  const appSettings = useAppSelector(sharedAppSelectors.selectAppSettings),
    appSettingsClient = useService(AppSettingsClient),
    newHandleSwitch = <K extends AppSettingsKey>(settingKey:AppSettingBoolKey<K>) =>
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
          <SettingsLabel >Start with PC</SettingsLabel>
          <FormControl>
            <Switch checked={appSettings.openAppOnBoot}
              aria-labelledby="general-open-app-on-boot"
              onChange={newHandleSwitch("openAppOnBoot")}
              name="general-open-app-on-boot"
              sx={{ gap: 8 }}
            />
          </FormControl>

          {/* TEXT SIZE (Electron ONLY) */}
              <SettingsDivider />
          <SettingsLabel >Auto Open Dash</SettingsLabel>
          <FormControl>
            <Switch checked={appSettings.openDashboardOnLaunch}
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
