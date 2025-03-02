

import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import { createTheme } from "./createTheme"
import React, { ReactNode } from "react"

import { isDev } from "../renderer-constants"


export interface ThemeProviderProps {
  children: ReactNode
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  // const { currentLang } = useTranslate()
  
  const theme = createTheme()
  if (isDev) {
    window["appTheme"] = theme
  }
  return (
    <MuiThemeProvider
      theme={theme}
    >
      <CssBaseline />
      {children}
    </MuiThemeProvider>
  )
}
