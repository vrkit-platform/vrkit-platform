import "!!style-loader!css-loader!sass-loader!assets/css/fonts/fonts.global.scss"
import globalStyles from "!!raw-loader!sass-loader!assets/css/global-electron.scss"

import React from "react"
import type { Decorator } from "@storybook/react"

import GlobalStyles from "@mui/material/GlobalStyles"
import { ThemeProvider } from "vrkit-app-renderer/theme/ThemeProvider"
import { createTheme } from "vrkit-app-renderer/theme/createTheme"
import { DevSupport } from "@react-buddy/ide-toolbox"
import ComponentPreviews from "./dev/previews"
import { important } from "vrkit-shared-ui"
import * as SBTheming from "@storybook/theming"
import { themes } from "@storybook/theming"

export const StoryPreviewContainer: Decorator = Story => {
  // React.useEffect(() => {
  //   const backgroundColor = dark ? themes.dark.appBg : themes.light.appBg
  //   Array(document.body, ...document.querySelectorAll("div.sbdocs.sbdocs-wrapper,div.sbdocs.sbdocs-content")).forEach((node:any) => {
  //     if (node?.style)
  //       //node.style.color = themes.dark.textColor ?? "inherit"
  //       node.style.backgroundColor = backgroundColor ?? "inherit"
  //   })
  // }, [dark])

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
  //, .sbdocs-content, .sb-unstyled
  return (
    <SBTheming.ThemeProvider theme={themes.dark}>
      <GlobalStyles
        styles={{
          "body, .sb-wrapper, .docs-story": {
            backgroundColor: important(theme.palette.background.root),
            backgroundImage: important(theme.palette.background.rootImage),
            color: important(themes.dark.textColor),
            // color: "white",
            fontFamily: theme.typography.fontFamily
          }
        }}
      />

      <ThemeProvider>
        <DevSupport ComponentPreviews={ComponentPreviews}>
          <Story />
        </DevSupport>
      </ThemeProvider>
    </SBTheming.ThemeProvider>
  )
}

export default StoryPreviewContainer
