// REACT
import React from "react"

// CLSX
// 3FV
import { getLogger } from "@3fv/logger-proxy"

import type { BoxProps } from "@mui/material/Box"
// MUI
import Box from "@mui/material/Box"
import { styled } from "@mui/material/styles"
import {
  child,
  FillBounds,
  FillWidth,
  FillWindow,
  flex,
  flexAlign,
  FlexAlignCenter,
  FlexAuto,
  FlexColumn,
  FlexRow,
  FlexScaleZero,
  hasCls,
  paddingRem,
  transition
} from "../../styles/ThemedStyles"

import { OverlayMode } from "../../../common/models/overlays"
import { ClassNamesKey, createClassNames } from "../../styles/createClasses"
import clsx from "clsx"
import { FlexRowCenterBox } from "../box"
import { useService } from "../service-container"
import { OverlayClient } from "../../services/overlay-client"
import Typography from "@mui/material/Typography"
import Button from "@mui/material/Button"
import SharedAppStateClient from "../../services/shared-app-state-client"
import { SizeI } from "vrkit-models"

const log = getLogger(__filename)
const { info, debug, warn, error } = log

const classPrefix = "overlayConfigEditor"
export const overlayConfigEditorClasses = createClassNames(classPrefix, "modeNormal", "modeEdit", "header", "content")
export type OverlayConfigEditorClassKey = ClassNamesKey<typeof overlayConfigEditorClasses>

const OverlayConfigEditorRoot = styled(Box, {
  name: "OverlayConfigEditorRoot",
  label: "OverlayConfigEditorRoot"
})(({ theme }) => ({
  position: "fixed",
  zIndex: 10000,
  borderRadius: "1rem",
  backgroundColor: theme.palette.background.gradient,
  backgroundImage: theme.palette.background.gradientImage,
  gap: "2rem",
  ...FlexColumn,
  ...FlexAlignCenter,
  ...FillWindow,
  ...FillBounds,

  ...transition(["opacity"]),

  [hasCls(overlayConfigEditorClasses.modeNormal)]: {
    opacity: 0,
    pointerEvents: "none"
  },

  [hasCls(overlayConfigEditorClasses.modeEdit)]: {
    opacity: 0.95,
    pointerEvents: "auto"
  },
  [child(overlayConfigEditorClasses.header)]: {
    ...FillWidth,
    ...FlexRow,
    ...flex(0, 0, "auto"),
    ...flexAlign("center", "stretch"),
    ...paddingRem(1, 2),
    gap: "2rem"
  },
  [child(overlayConfigEditorClasses.content)]: {
    ...FlexColumn,
    ...FlexScaleZero,
    ...flexAlign("center", "center")
  }
}))

/**
 * OverlayConfigEditor Component Properties
 */
export interface OverlayWindowLayoutEditorProps extends BoxProps {
  mode: OverlayMode
  size: SizeI
}

/**
 * OverlayConfigEditor Component
 *
 * @param { OverlayWindowLayoutEditorProps } props
 * @returns {JSX.Element}
 */
export function OverlayWindowLayoutEditor(props: OverlayWindowLayoutEditorProps) {
  const { mode,size, ...other } = props,
    isEditMode = mode !== OverlayMode.NORMAL,
    overlayClient = useService(OverlayClient),
      sharedAppStateClient = useService(SharedAppStateClient),
    overlayConfig = overlayClient.overlayConfig,
    overlayInfo = overlayConfig?.overlay

  return (
    <OverlayConfigEditorRoot
      className={clsx({
        [overlayConfigEditorClasses.modeNormal]: !isEditMode,
        [overlayConfigEditorClasses.modeEdit]: isEditMode
      })}
      {...other}
    >
      {size.height > 200 ?<>
      <Box className={overlayConfigEditorClasses.header}>
        
        <Typography
          className="electronWindowDraggable"
          sx={{ ...FlexScaleZero }}
          variant="h4"
        >
          Editing <i>&quot;{overlayInfo.name}&quot;</i>
        </Typography>
        <Button
          variant="contained"
          sx={{ ...FlexAuto }}
          onClick={() => {
            sharedAppStateClient.setOverlayMode(OverlayMode.NORMAL)
          }}
        >
          Done
        </Button>
      </Box>
      <Box className={clsx("electronWindowDraggable", overlayConfigEditorClasses.content)}>
        <FlexRowCenterBox>Resize: drag corner anchors</FlexRowCenterBox>
        <FlexRowCenterBox>Move: click & drag anywhere in this window</FlexRowCenterBox>
      </Box>
      </> : <>
        <Typography
            className="electronWindowDraggable"
            sx={{ ...FlexScaleZero }}
            variant="h4"
        >
          Resize & Drag
        </Typography>
      </>}
    </OverlayConfigEditorRoot>
  )
}

export default OverlayWindowLayoutEditor
