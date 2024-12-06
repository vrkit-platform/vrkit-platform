import "!!style-loader!css-loader!sass-loader!assets/css/fonts/fonts.global.scss"
import globalStyles from "!!raw-loader!sass-loader!assets/css/global-electron.scss"

import React from "react"
import type { Decorator } from "@storybook/react"

import GlobalStyles from "@mui/material/GlobalStyles"
import { ThemeProvider } from "vrkit-app-renderer/theme/ThemeProvider"
import { createTheme } from "vrkit-app-renderer/theme/createTheme"

export const StoryPreviewContainer: Decorator = Story => {
  const theme = createTheme()

  React.useLayoutEffect(() => {
    const headEl = document.head || document.getElementsByTagName("head")[0],
      styleEl = document.createElement("style")

    headEl.appendChild(styleEl)

    styleEl.appendChild(document.createTextNode(globalStyles as any))

    return () => {
      headEl.removeChild(styleEl)
    }
  })
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
      <ThemeProvider>
        <Story />
      </ThemeProvider>
    </>
  )
}

export default StoryPreviewContainer
