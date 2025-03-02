import "!!style-loader!css-loader!sass-loader!assets/css/fonts/fonts.global.scss"

// ----------------------------------------------------------------------
import { AppRouter } from "vrkit-app-renderer/components/app-router"
import React from "react"
import GlobalStyles from "@mui/material/GlobalStyles"
import { useTheme } from "@mui/material/styles"

export default function AppBody() {
  const theme = useTheme()
  
  return (
    <>
      <GlobalStyles
        styles={{
          body: {
            backgroundColor: theme.palette.background.root,
            backgroundImage: theme.palette.background.rootImage,
            fontFamily: theme.typography.fontFamily
          }
        }}
      />
      <AppRouter />
    </>
  )
}
