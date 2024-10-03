import "vrkit-plugin-sdk"
import { BoxProps } from "@mui/material/Box"

import { getLogger } from "@3fv/logger-proxy"

import { createClassNames } from "vrkit-app-renderer/styles/createClasses"
import { PluginClientComponentProps } from "vrkit-plugin-sdk"
import React, { useEffect, useState } from "react"
import { useInterval } from "usehooks-ts"

import { getLocalTimeParts, TimeParts } from "vrkit-app-renderer/components/time"
import { FlexRowCenterBox, FlexScaleZeroBox } from "../../components/box"
import { padStart } from "lodash"
import clsx from "clsx"
import { styled } from "@mui/material/styles"
import {
  alpha,
  FillWidth,
  FlexAuto,
  FlexRow,
  FlexRowCenter,
  hasCls, rem
} from "../../styles"

const log = getLogger(__filename)

const classNamePrefix = "vrEditorOverlayPlugin"

const classNames = createClassNames(classNamePrefix, "root")

const VREditorViewRoot = styled(FlexRowCenterBox, {
  name: "VREditorView",
  label: "VREditorView"
})(({ theme }) => {
  return {
    [hasCls(classNames.root)]: {
      borderRadius: rem(1),
      backgroundColor: alpha(theme.palette.grey.A700, 0.9),
      color: theme.palette.getContrastText(theme.palette.grey.A700),
      ...FillWidth,
      ...FlexRowCenter
    }
  }
})


interface VREditorViewProps extends BoxProps {

}

function VREditorView({ className, ...other }: VREditorViewProps) {
  return (
    <VREditorViewRoot className={clsx(classNames.root,className)}>
      VR Editor
    </VREditorViewRoot>
  )
}

function VREditorOverlayPlugin(props: PluginClientComponentProps) {
  const { client, width, height } = props

  return (
    <VREditorView />
  )
}

export default VREditorOverlayPlugin
