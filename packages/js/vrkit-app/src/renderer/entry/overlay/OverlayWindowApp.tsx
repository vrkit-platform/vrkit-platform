import "!!style-loader!css-loader!sass-loader!assets/css/fonts/fonts.global.scss"
import globalStyles from "!!raw-loader!sass-loader!assets/css/global-electron.scss"

import React, { useLayoutEffect } from "react"
import { LocalizationProvider } from "vrkit-app-renderer/locales"
import { I18nProvider } from "vrkit-app-renderer/locales/i18n-provider"
import { ThemeProvider } from "vrkit-app-renderer/theme/theme-provider"


import OverlayWindowAppBody from "./OverlayWindowAppBody"


export default function OverlayWindowApp() {
  
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
    
      <I18nProvider>
        <LocalizationProvider>
            <ThemeProvider>
              <OverlayWindowAppBody />
            </ThemeProvider>
        </LocalizationProvider>
      </I18nProvider>

  )
}
