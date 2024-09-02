import "vrkit-app-renderer/global.css"

// ----------------------------------------------------------------------
import { Router } from "vrkit-app-renderer/routes/sections"

import { useScrollToTop } from "vrkit-app-renderer/hooks/use-scroll-to-top"
import { LocalizationProvider } from "vrkit-app-renderer/locales"
import { I18nProvider } from "vrkit-app-renderer/locales/i18n-provider"
import { ThemeProvider } from "vrkit-app-renderer/theme/theme-provider"

import { MotionLazy } from "vrkit-app-renderer/components/animate/motion-lazy"
import { Provider as ReduxProvider } from "react-redux"
import {
  defaultSettings,
  SettingsProvider
} from "vrkit-app-renderer/components/settings"
import useAppStore from "./hooks/useAppStore"


export default function App() {
  useScrollToTop()
  const appStore = useAppStore()
  
  return (
    <ReduxProvider store={appStore}>
      <I18nProvider>
        <LocalizationProvider>
          <SettingsProvider settings={defaultSettings}>
            <ThemeProvider>
              <MotionLazy>
                <Router />
              </MotionLazy>
            </ThemeProvider>
          </SettingsProvider>
        </LocalizationProvider>
      </I18nProvider>
    </ReduxProvider>
  )
}
