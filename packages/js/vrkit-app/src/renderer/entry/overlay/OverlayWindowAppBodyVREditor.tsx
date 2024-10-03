import React from "react"
import GlobalStyles from "@mui/material/GlobalStyles"
import { styled, useTheme } from "@mui/material/styles"
import { createClassNames } from "vrkit-app-renderer/styles/createClasses"
import { getLogger } from "@3fv/logger-proxy"
import Box from "@mui/material/Box"
import { Fill, flexAlign, FlexRow, FlexRowCenter, hasCls, OverflowHidden } from "vrkit-app-renderer/styles/ThemedStyles"
import { OverlayMode } from "../../../common/models/overlays"
import { useAppSelector } from "vrkit-app-renderer/services/store"
import { sharedAppSelectors } from "vrkit-app-renderer/services/store/slices/shared-app"
import clsx from "clsx"

const log = getLogger(__filename)
const { info, debug, warn, error } = log

const classPrefix = "overlayWindowBodyVREditor"
const classNames = createClassNames(classPrefix, "root")

const OverlayWindowAppBodyVREditorRoot = styled(Box, {
  name: "OverlayWindowAppBodyVREditorRoot",
  label: "OverlayWindowAppBodyVREditorRoot"
})(({ theme }) => ({
  [hasCls(classNames.root)]: {
    position: "relative",
    objectFit: "contain",
    ...FlexRowCenter,
    ...Fill
    // ...heightConstraint(
    //     "calc(100% - 2rem)")
  }
}))

export default function OverlayWindowAppBodyVREditor() {
  const theme = useTheme(),
    mode = useAppSelector(sharedAppSelectors.selectOverlayMode),
    isEditMode = mode !== OverlayMode.NORMAL
  return (
    <>
      <GlobalStyles
        styles={{
          body: {
            backgroundColor: "#00000055",
            //backgroundColor: "#00000000", //theme.palette.background.gradient,
            // backgroundImage: theme.palette.background.gradientImage
            "& > #root": {
              ...OverflowHidden,
              ...FlexRow,
              ...flexAlign("stretch", "stretch")
            }
          }
        }}
      />
      <OverlayWindowAppBodyVREditorRoot
        id="content"
        className={clsx(classNames.root)}
      >
        VR EDITOR HERE
      </OverlayWindowAppBodyVREditorRoot>
    </>
  )
}
