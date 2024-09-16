// REACT
import React, { useEffect, useState } from "react"

// CLSX
// 3FV
import { getLogger } from "@3fv/logger-proxy"

import type { BoxProps } from "@mui/material/Box"
// MUI
import Box from "@mui/material/Box"
import { styled } from "@mui/material/styles"
import {
  dimensionConstraints, FillBounds,
  FillWindow,
  hasCls
} from "vrkit-app-renderer/styles/ThemedStyles"
import { OverlayClient } from "vrkit-app-renderer/services/overlay-client/OverlayClient"
import { useService } from "vrkit-app-renderer/components/service-container"
import { OverlayClientEventType, OverlayMode } from "vrkit-app-common/models/overlay-manager"
import { ClassNamesKey, createClassNames } from "vrkit-app-renderer/styles/createClasses"
import clsx from "clsx"

// APP
// import { ClassNamesKey, createClassNames, child } from "@taskx/lib-styles"

const log = getLogger(__filename)
const { info, debug, warn, error } = log

const classPrefix = "overlayConfigEditor"
export const overlayConfigEditorClasses = createClassNames(classPrefix, "modeNormal", "modeEdit")
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
  ...FillWindow,
  ...FillBounds,
  // ...dimensionConstraints("100vw", "100vh"),
  
  [hasCls(overlayConfigEditorClasses.modeNormal)]: {
    opacity: 0,
    pointerEvents: "none"
  },
  
  [hasCls(overlayConfigEditorClasses.modeEdit)]: {
    opacity: 0.95,
    pointerEvents: "auto"
  }
}))

/**
 * OverlayConfigEditor Component Properties
 */
export interface OverlayConfigEditorProps extends BoxProps {}

/**
 * OverlayConfigEditor Component
 *
 * @param { OverlayConfigEditorProps } props
 * @returns {JSX.Element}
 */
export function OverlayConfigEditor(props: OverlayConfigEditorProps) {
  const { ...other } = props,
    overlayClient = useService(OverlayClient),
    [mode, setMode] = useState(overlayClient.mode),
      isEditMode = mode !== OverlayMode.NORMAL

  useEffect(() => {
    const onModeEvent = (newMode: OverlayMode) => {
      setMode(newMode)
    }
    overlayClient.on(OverlayClientEventType.OVERLAY_MODE, onModeEvent)
    return () => {
      overlayClient.off(OverlayClientEventType.OVERLAY_MODE, onModeEvent)
    }
  }, [])

  return <OverlayConfigEditorRoot className={clsx({
    [overlayConfigEditorClasses.modeNormal]: !isEditMode,
    [overlayConfigEditorClasses.modeEdit]: isEditMode
  })} {...other}>
    Edit Overlay Position
  </OverlayConfigEditorRoot>
}

export default OverlayConfigEditor
