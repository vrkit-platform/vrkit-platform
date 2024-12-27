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
  alpha,
  child,
  FillBounds,
  FillWidth,
  FillWindow,
  flex,
  flexAlign,
  FlexAlignCenter,
  FlexColumn,
  FlexRow,
  FlexRowCenter,
  FlexScaleZero,
  hasCls, important,
  paddingRem,
  transition
} from "@vrkit-platform/shared-ui"

import { ClassNamesKey, createClassNames } from "@vrkit-platform/shared-ui"
import clsx from "clsx"
import { FlexRowCenterBox } from "@vrkit-platform/shared-ui"
import { useService } from "../service-container"
import { OverlayManagerClient } from "../../services/overlay-manager-client"
import Typography from "@mui/material/Typography"
import SharedAppStateClient from "../../services/shared-app-state-client"
import { SizeI } from "@vrkit-platform/models"
import { sharedAppSelectors } from "../../services/store/slices/shared-app"
import { useAppSelector } from "../../services/store"
import { darken } from "@mui/material"
import { overlayWindowSelectors } from "../../services/store/slices/overlay-window"

const log = getLogger(__filename)
const { info, debug, warn, error } = log

const classPrefix = "overlayConfigEditor"
export const overlayConfigEditorClasses = createClassNames(
  classPrefix,
  "modeNormal",
  "modeEdit",
  "header",
  "content",
  "selected",
  "vr",
  "screen"
)
export type OverlayConfigEditorClassKey = ClassNamesKey<typeof overlayConfigEditorClasses>

const OverlayConfigEditorRoot = styled(Box, {
  name: "OverlayConfigEditorRoot",
  label: "OverlayConfigEditorRoot"
})(({ theme }) => ({
  position: "fixed",
  zIndex: 10000,
  borderRadius: "1rem",
  borderColor: "transparent",

  borderStyle: "inset",
  borderWidth: "5px",

  color: theme.palette.text.primary, // backgroundImage:
  // theme.palette.action.active,
  gap: "2rem",
  ...FlexColumn,
  ...FlexAlignCenter,
  ...FillWindow,
  ...FillBounds,
  top: 0,
  left: 0,

  ...transition(["opacity"]),
  [hasCls(overlayConfigEditorClasses.screen)]: {
    backgroundColor: alpha(theme.palette.action.active, 0.7)
  },
  [hasCls(overlayConfigEditorClasses.vr)]: {
    backgroundColor: alpha(theme.palette.action.active, 0.7)
  },
  [hasCls(overlayConfigEditorClasses.selected)]: {
    borderColor: darken(theme.palette.action.active, 0.5),
    backgroundColor: important(alpha(theme.palette.action.active, 0.8)) // borderColor: theme.palette.action.active,
    // borderColor: darken(theme.palette.action.active, 0.3),
  },
  [hasCls(overlayConfigEditorClasses.modeNormal)]: {
    opacity: 0,
    pointerEvents: "none"
  },

  [hasCls(overlayConfigEditorClasses.modeEdit)]: {
    opacity: 0.95,
    pointerEvents: "auto",
    borderColor: darken(theme.palette.action.disabled, 0.3)
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
    ...flexAlign("center", "center"),
    ...theme.typography.h6
  }
}))

/**
 * OverlayConfigEditor Component Properties
 */
export interface OverlayWindowLayoutEditorProps extends BoxProps {
  editorEnabled: boolean

  size: SizeI
}

/**
 * OverlayConfigEditor Component
 *
 * @param { OverlayWindowLayoutEditorProps } props
 */
export function OverlayWindowLayoutEditor(props: OverlayWindowLayoutEditorProps) {
  const { editorEnabled, size, ...other } = props,
    isEditMode = editorEnabled,
    isVR = useAppSelector(overlayWindowSelectors.selectedIsVR),
    selectedOverlayConfigId = useAppSelector(sharedAppSelectors.selectEditorSelectedOverlayConfigId),
    
    overlayClient = useService(OverlayManagerClient),
    sharedAppStateClient = useService(SharedAppStateClient),
    overlayConfig = overlayClient.overlayConfig,
    overlayInfo = overlayConfig?.overlay

  return (
    <OverlayConfigEditorRoot
      className={clsx({
        [overlayConfigEditorClasses.modeNormal]: !isEditMode,
        [overlayConfigEditorClasses.modeEdit]: isEditMode,
        [overlayConfigEditorClasses.selected]: isVR && selectedOverlayConfigId === overlayInfo.id,
        [overlayConfigEditorClasses.screen]: !isVR && isEditMode,
        [overlayConfigEditorClasses.vr]: isVR && isEditMode,
        electronWindowDraggable: !isVR && isEditMode
      })}
      {...other}
    >
      {isVR ? (
        <></>
      ) : size.height > 200 ? (
        <>
          <Box className={clsx(overlayConfigEditorClasses.content)}>
            <FlexRowCenterBox>Resize: drag corner anchors</FlexRowCenterBox>
            <FlexRowCenterBox>Move: click & drag anywhere in this window</FlexRowCenterBox>
          </Box>
        </>
      ) : (
        <>
          <Typography
            sx={{
              ...FlexScaleZero,
              fontSize: "1.2rem",
              ...FlexRowCenter
            }}
            variant="h4"
          >
            Resize & Drag
          </Typography>
        </>
      )}
    </OverlayConfigEditorRoot>
  )
}

export default OverlayWindowLayoutEditor
