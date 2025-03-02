import { useScrollToTop } from "../../hooks/useScrollToTop"
import { I18nProvider } from "vrkit-app-renderer/locales/i18n-provider"
import { ThemeProvider } from "../../theme/ThemeProvider"
import { AppAlertCenter } from "../../components/app-alert-center"

import { MotionLazy } from "vrkit-app-renderer/components/animate/motion-lazy"
import { Provider as ReduxProvider } from "react-redux"
import { defaultSettings, SettingsProvider } from "vrkit-app-renderer/components/settings"
import useAppStore from "../../hooks/useAppStore"

import "!!style-loader!css-loader!sass-loader!assets/css/fonts/fonts.global.scss"
import globalStyles from "!!raw-loader!sass-loader!assets/css/global-electron.scss"
import React, { useLayoutEffect } from "react"
import AppBody from "./AppBody"


export default function App() {
  // SETUP SCROLLING
  useScrollToTop()
  
  // USE APP STORE
  const appStore = useAppStore()

  // INJECT GLOBAL STYLES
  useLayoutEffect(() => {
    const headEl = document.head || document.getElementsByTagName("head")[0],
      styleEl = document.createElement("style")

    headEl.appendChild(styleEl)

    styleEl.appendChild(document.createTextNode(globalStyles as any))

    return () => {
      headEl.removeChild(styleEl)
    }
  })
  return (
    <ReduxProvider store={appStore}>
      <I18nProvider>
        <SettingsProvider settings={defaultSettings}>
          <ThemeProvider>
            <MotionLazy>
              <AppBody />
              <AppAlertCenter />
            </MotionLazy>
          </ThemeProvider>
        </SettingsProvider>
      </I18nProvider>
    </ReduxProvider>
  )
}
