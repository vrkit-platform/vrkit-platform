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
      ...flexAlign("flex-start", "flex-start")
    }
  }
})

interface VREditorViewProps extends BoxProps {}

function VREditorView({ className, ...other }: VREditorViewProps) {
  // const vreState = useVREditorState(),
  const  theme = useTheme()
  return (
    <VREditorViewRoot className={clsx(classNames.root, className)}>
      <Kbd>Ctrl</Kbd>+<Kbd>Enter</Kbd>
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
      VREditor Info Window
    </VREditorViewRoot>
  )
}

function VREditorInfoOverlayPlugin(props: PluginClientComponentProps) {
  const { client, width, height } = props

  return <VREditorView />
}

// async function loadVREditorPlugin(): Promise<React.ComponentType<PluginClientComponentProps>> {
//   // await createVREditorControllerClient()
//   return VREditorOverlayPlugin
// }

export default VREditorInfoOverlayPlugin
