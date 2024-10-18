// import "vrkit-app-renderer/global.css"

// ----------------------------------------------------------------------
import { Router } from "vrkit-app-renderer/routes/sections"

import "!!style-loader!css-loader!sass-loader!assets/css/fonts/fonts.global.scss"
import React from "react"
import GlobalStyles from "@mui/material/GlobalStyles"
import { useTheme } from "@mui/material/styles"

export default function AppBody() {
  const theme = useTheme()
  // useEffect(() => {
  //   const bodyEl = document.querySelector("body")
  //   bodyEl.style
  // })
  return (
    <>
      <GlobalStyles
        styles={{
          body: {
            backgroundColor: theme.palette.background.gradient,
            backgroundImage: theme.palette.background.gradientImage,
            fontFamily: theme.typography.fontFamily
          }
        }}
      />
      <Router />
    </>
  )
}
