import { Box, Button, Divider, FormControl, Radio, RadioGroup, styled, Typography } from "@mui/material"
import * as React from "react"
import { FormContainer, FormContent, formContentClasses } from "../../../components/form"
import ThemeAutoIcon from "assets/images/settings/theme-auto-icon.png"
import ThemeLightIcon from "assets/images/settings/theme-light-icon.png"
import ThemeDarkIcon from "assets/images/settings/theme-dark-icon.png"
import { Fill, FlexColumnCenter, FlexDefaults, FlexRowCenter, FlexScaleZero, hasCls } from "@vrkit-platform/shared-ui"
import { lighten } from "@mui/material/styles"
import { SettingsDivider } from "../components/SettingsDivider"
import { SettingsLabel } from "../components/SettingsLabel"
import { useService } from "../../../components/service-container"
import { useAppDispatch, useAppSelector } from "../../../services/store"
import { ZoomFactorIncrement, ZoomFactorMax, ZoomFactorMin } from "../../../../common/common-constants"
import { sharedAppSelectors } from "../../../services/store/slices/shared-app"

import { ActionRegistry, stopEvent } from "@vrkit-platform/shared"
import { AppSettingsClient } from "../../../services/app-settings-client"
import { ThemeType } from "@vrkit-platform/models"
import { isElectron } from "../../../renderer-constants"
import { getLogger } from "@3fv/logger-proxy"

const log = getLogger(__filename)

export interface AppearanceSettingsPanelProps {}

const AppearanceFormContainer = styled(FormContainer, {
  name: "AppearanceFormContainer"
})(({ theme }) => ({
  ...Fill,
  ...FlexColumnCenter
}))

const AppearanceFormContent = styled(FormContent, {
  name: "AppearanceFormContent"
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

export function AppearanceSettingsPanel(_props: AppearanceSettingsPanelProps) {
  const appSettings = useAppSelector(sharedAppSelectors.selectAppSettings),
    dispatch = useAppDispatch(),
    appSettingsClient = useService(AppSettingsClient),
    actions = useService(ActionRegistry),
    handleTheme = (e: React.ChangeEvent, value: string) => {
      stopEvent(e)
      if (!/\d+/.test(value)) {
        log.warn(`Invalid theme type value ${value}`)
        return
      }

      const newThemeTypeValue = parseInt(value, 10)
      log.assert(!!ThemeType[newThemeTypeValue], `No theme type maps to ${newThemeTypeValue}`)
      appSettingsClient.changeSettings({ themeType: newThemeTypeValue })
    },
    newHandleZoomIncrement = (amount: number) => (e: React.MouseEvent) => {
      stopEvent(e)
      const newZoomFactor = appSettings.zoomFactor + amount
      appSettingsClient.changeSettings({
        zoomFactor: Math.max(ZoomFactorMin, Math.min(newZoomFactor, ZoomFactorMax))
      })
    },
    handleZoomOut = newHandleZoomIncrement(-1 * ZoomFactorIncrement),
    handleZoomIn = newHandleZoomIncrement(ZoomFactorIncrement)

  return (
    <AppearanceFormContainer>
      <AppearanceFormContent
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
          <SettingsLabel>Theme</SettingsLabel>
          <FormControl>
            <RadioGroup
              aria-labelledby="appearance-theme-options-label"
              value={appSettings.themeType ?? ThemeType.DARK}
              onChange={handleTheme}
              name="appearance-theme-options"
              row
              sx={{ gap: 8 }}
            >
              <Box {...(FlexColumnCenter as any)}>
                <Radio
                  disableRipple
                  disableFocusRipple
                  disableTouchRipple
                  radioGroup="appearance-theme-options"
                  icon={<img src={ThemeDarkIcon} />}
                  checkedIcon={
                    <img
                      className={"checked"}
                      src={ThemeDarkIcon}
                    />
                  }
                  value={ThemeType.DARK}
                />
                <Typography>Dark</Typography>
              </Box>
              <Box {...(FlexColumnCenter as any)}>
                <Radio
                  disableRipple
                  disableFocusRipple
                  disableTouchRipple
                  radioGroup="appearance-theme-options"
                  value={ThemeType.LIGHT}
                  icon={<img src={ThemeLightIcon} />}
                  checkedIcon={
                    <img
                      className={"checked"}
                      src={ThemeLightIcon}
                    />
                  }
                />
                <Typography>Light</Typography>
              </Box>
              <Box {...(FlexColumnCenter as any)}>
                <Radio
                  disableRipple
                  disableFocusRipple
                  disableTouchRipple
                  radioGroup="appearance-theme-options"
                  value={ThemeType.AUTO}
                  icon={<img src={ThemeAutoIcon} />}
                  checkedIcon={
                    <img
                      className={"checked"}
                      src={ThemeAutoIcon}
                    />
                  }
                />
                <Typography>Auto</Typography>
              </Box>
            </RadioGroup>
          </FormControl>

          {/* TEXT SIZE (Electron ONLY) */}
          {isElectron && (
            <>
              <SettingsDivider />
              <SettingsLabel>Text Size</SettingsLabel>
              <Box
                sx={{
                  ...FlexColumnCenter,
                  gap: 4
                }}
              >
                <Box
                  sx={{
                    ...FlexRowCenter,
                    gap: 4
                  }}
                >
                  <Button
                    onClick={handleZoomOut}
                    variant="text"
                    sx={{
                      fontFamily: "'Times New Roman'",
                      fontSize: "1rem",
                      color: "primary.main"
                    }}
                  >
                    Aa
                  </Button>

                  <Divider
                    orientation="vertical"
                    sx={{ alignSelf: "stretch" }}
                  />

                  <Button
                    onClick={handleZoomIn}
                    variant="text"
                    sx={{
                      fontFamily: "'Times New Roman'",
                      fontSize: "1.6rem",
                      color: "primary.main"
                    }}
                  >
                    Aa
                  </Button>
                </Box>
                <Typography
                  sx={{
                    ...FlexRowCenter,
                    opacity: 0.5
                  }}
                >
                  Current text size is {Math.round(appSettings.zoomFactor * 100.0)}%
                </Typography>
              </Box>
            </>
          )}
        </Box>
      </AppearanceFormContent>
    </AppearanceFormContainer>
  )
}
