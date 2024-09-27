import "!!style-loader!css-loader!sass-loader!assets/css/fonts/fonts.global.scss"
import "!!style-loader!css-loader!sass-loader!assets/css/global-overlay-window.scss"
import globalStyles from "!!raw-loader!sass-loader!assets/css/global-electron.scss"

import React, { useLayoutEffect } from "react"
import { LocalizationProvider } from "vrkit-app-renderer/locales"
import { I18nProvider } from "vrkit-app-renderer/locales/i18n-provider"
import { ThemeProvider } from "../../theme/ThemeProvider"
import { Provider as ReduxProvider } from "react-redux"

import OverlayWindowAppBody from "./OverlayWindowAppBody"
import useAppStore from "vrkit-app-renderer/hooks/useAppStore"

export default function OverlayWindowApp() {
  const appStore = useAppStore()

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
        <LocalizationProvider>
          <ThemeProvider>
            <OverlayWindowAppBody />
          </ThemeProvider>
        </LocalizationProvider>
      </I18nProvider>
    </ReduxProvider>
  )
}
