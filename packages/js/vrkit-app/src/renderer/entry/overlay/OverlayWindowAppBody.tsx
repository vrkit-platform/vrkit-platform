import "!!style-loader!css-loader!sass-loader!assets/css/fonts/fonts.global.scss"
import React, { useCallback, useEffect, useRef, useState } from "react"
import GlobalStyles from "@mui/material/GlobalStyles"
import { styled, useTheme } from "@mui/material/styles"
import { PluginClientManager } from "vrkit-app-renderer/services/overlay-client"
import { useService } from "vrkit-app-renderer/components/service-container"
import { SizeI } from "vrkit-models"
import { OverlayWindowLayoutEditor } from "../../components/overlay-window-layout-editor"
import { ClassNamesKey, createClassNames } from "vrkit-app-renderer/styles/createClasses"
import { getLogger } from "@3fv/logger-proxy"
import Box from "@mui/material/Box"
import {
  flexAlign,
  FlexRow,
  FlexRowCenter,
  FlexScaleZero,
  heightConstraint,
  OverflowHidden
} from "vrkit-app-renderer/styles/ThemedStyles"
import { OverlayMode } from "vrkit-app-common/models/overlay-manager"
import { useAppSelector } from "vrkit-app-renderer/services/store"
import { sharedAppSelectors } from "vrkit-app-renderer/services/store/slices/shared-app"

const log = getLogger(__filename)
const { info, debug, warn, error } = log

const classPrefix = "overlayConfigEditor"
export const overlayConfigEditorClasses = createClassNames(classPrefix, "modeNormal", "modeEdit")
export type OverlayConfigEditorClassKey = ClassNamesKey<typeof overlayConfigEditorClasses>

const OverlayAppBodyContentRoot = styled(Box, {
  name: "OverlayAppBodyContentRoot",
  label: "OverlayAppBodyContentRoot"
})(({ theme }) => ({
  position: "relative",
  objectFit: "contain",
  ...FlexRowCenter,
  ...FlexScaleZero,
  ...heightConstraint("calc(100% - 2rem)")
}))

export default function OverlayWindowAppBody() {
  const theme = useTheme(),
    mode = useAppSelector(sharedAppSelectors.selectOverlayMode),
    isEditMode = mode !== OverlayMode.NORMAL,
    contentRef = useRef<HTMLDivElement>(),
    [size, setSize] = useState<SizeI>(null),
    pluginClientManager = useService(PluginClientManager),
    updateSize = useCallback((el: HTMLElement) => {
      const { clientWidth: width, clientHeight: height } = el,
        newSize = { width, height }
      log.info("New overlay window body content size", newSize)
      setSize(newSize)
    }, []),
    resizeCallback = useCallback(
      (entries: ResizeObserverEntry[]) => {
        if (!entries.length) return

        updateSize(entries[0].target as HTMLElement)
      },
      [updateSize]
    ),
    PluginComponent = pluginClientManager.getReactComponent()

  // Create & Apply a resize observer
  // TODO: Move this to a hook
  useEffect(() => {
    if (contentRef.current) {
      const observer = new ResizeObserver(resizeCallback)
      observer.observe(contentRef.current, {
        box: "border-box"
      })

      updateSize(contentRef.current)

      return () => {
        observer.disconnect()
      }
    }
  }, [contentRef.current, isEditMode])

  return (
    <>
      <GlobalStyles
        styles={{
          body: {
            backgroundColor: "#00000000", //theme.palette.background.gradient,
            // backgroundImage: theme.palette.background.gradientImage
            "& > #root": {
              ...OverflowHidden,
              ...FlexRow,
              ...flexAlign("stretch", "stretch")
            }
          }
        }}
      />
      {!isEditMode && (
        <OverlayAppBodyContentRoot
          id="content"
          ref={contentRef}
        >
          {size && (
            <PluginComponent
              client={getVRKitPluginClient()}
              {...size}
            />
          )}
        </OverlayAppBodyContentRoot>
      )}
      <OverlayWindowLayoutEditor mode={mode} />
    </>
  )
}
