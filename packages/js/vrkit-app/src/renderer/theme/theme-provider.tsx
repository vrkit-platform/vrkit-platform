

import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import { useSettingsContext } from "vrkit-app-renderer/components/settings"
import { createTheme } from "./create-theme"
import React from "react"
import { useTranslate } from "vrkit-app-renderer/locales/use-locales"


export interface ThemeProviderProps {
  children: React.ReactNode
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const { currentLang } = useTranslate()

  
  const theme = createTheme(currentLang?.systemValue)

  return (
    <MuiThemeProvider
      theme={theme}
    >
      <CssBaseline />
      {children}
    </MuiThemeProvider>
  )
}
