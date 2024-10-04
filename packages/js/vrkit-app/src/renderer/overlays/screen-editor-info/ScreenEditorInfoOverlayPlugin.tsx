import "vrkit-plugin-sdk"
import { BoxProps } from "@mui/material/Box"

import { getLogger } from "@3fv/logger-proxy"

import { createClassNames } from "vrkit-app-renderer/styles/createClasses"
import { PluginClientComponentProps } from "vrkit-plugin-sdk"
import React from "react"
import { FlexRowCenterBox } from "../../components/box"
import clsx from "clsx"
import { styled, useTheme } from "@mui/material/styles"
import { alpha, FillWindow, flexAlign, FlexColumn, hasCls, rem } from "../../styles"
import { Kbd } from "../../components/keyboard-key"

const log = getLogger(__filename)

const classNamePrefix = "screenEditorOverlayPlugin"

const classNames = createClassNames(classNamePrefix, "root")

const ScreenEditorViewRoot = styled(FlexRowCenterBox, {
  name: "ScreenEditorView",
  label: "ScreenEditorView"
})(({ theme }) => {
  return {
    [hasCls(classNames.root)]: {
      borderRadius: rem(1),
      backgroundColor: alpha(theme.palette.grey.A700, 0.9),
      color: theme.palette.getContrastText(theme.palette.grey.A700),
      ...FillWindow,
      ...FlexColumn,
      ...flexAlign("flex-start", "flex-start")
    }
  }
})

interface ScreenEditorViewProps extends BoxProps {}

function ScreenEditorView({ className, ...other }: ScreenEditorViewProps) {
  
  const  theme = useTheme()
  return (
    <ScreenEditorViewRoot className={clsx(classNames.root, className)}>
      <Kbd>Ctrl</Kbd>+<Kbd>Enter</Kbd>
  
      ScreenEditor Info Window
    </ScreenEditorViewRoot>
  )
}

function ScreenEditorInfoOverlayPlugin(props: PluginClientComponentProps) {
  const { client, width, height } = props

  return <ScreenEditorView />
}

export default ScreenEditorInfoOverlayPlugin
