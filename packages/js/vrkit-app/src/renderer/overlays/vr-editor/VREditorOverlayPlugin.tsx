import "vrkit-plugin-sdk"
import Box, { BoxProps } from "@mui/material/Box"

import { getLogger } from "@3fv/logger-proxy"

import { createClassNames } from "vrkit-app-renderer/styles/createClasses"
import { PluginClientComponentProps } from "vrkit-plugin-sdk"
import React, { useEffect, useState } from "react"
import { useInterval } from "usehooks-ts"

import { getLocalTimeParts, TimeParts } from "vrkit-app-renderer/components/time"
import { FlexRowCenterBox, FlexScaleZeroBox } from "../../components/box"
import { padStart } from "lodash"
import clsx from "clsx"
import { styled, useTheme } from "@mui/material/styles"
import {
  alpha,
  Ellipsis,
  FillWidth,
  FillWindow,
  flexAlign,
  FlexAuto,
  FlexColumn,
  FlexColumnCenter,
  FlexRow,
  FlexRowCenter,
  hasCls, padding,
  paddingRem,
  rem
} from "../../styles"
import createVREditorControllerClient, {useVREditorState} from "./VREditorControllerClient"

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
      ...FillWindow,
      ...FlexColumn,
      ...flexAlign("flex-start","flex-start"),
      
    }
  }
})


interface VREditorViewProps extends BoxProps {

}

function VREditorView({ className, ...other }: VREditorViewProps) {
  const vreState = useVREditorState(),
      theme = useTheme()
  return (
    <VREditorViewRoot className={clsx(classNames.root,className)}>
      {/*{vreState.overlayConfigs.map(config =>*/}
      {/*    <Box*/}
      {/*        key={config.overlay.id}*/}
      {/*        sx={{*/}
      {/*          ...FillWidth,*/}
      {/*          ...FlexRow,*/}
      {/*          ...FlexAuto,*/}
      {/*          ...padding(`1rem`),*/}
      {/*          ...flexAlign("flex-start","center"),*/}
      {/*          // filter: `drop-shadow(0 0 0.75rem ${theme.palette.background.session})`,*/}
      {/*          borderBottom: `1px solid ${theme.palette.background.session}`,*/}
      {/*          gap: "1rem"*/}
      {/*        }}*/}
      {/*    >*/}
      {/*      <FlexScaleZeroBox sx={{*/}
      {/*        ...Ellipsis*/}
      {/*      }}>*/}
      {/*        {config.overlay.name}*/}
      {/*      </FlexScaleZeroBox>*/}
      {/*</Box>)}*/}
    </VREditorViewRoot>
  )
}

function VREditorOverlayPlugin(props: PluginClientComponentProps) {
  const { client, width, height } = props

  return (
    <VREditorView />
  )
}

async function loadVREditorPlugin(): Promise<React.ComponentType<PluginClientComponentProps>> {
  await createVREditorControllerClient()
  return VREditorOverlayPlugin
}

export default loadVREditorPlugin()
