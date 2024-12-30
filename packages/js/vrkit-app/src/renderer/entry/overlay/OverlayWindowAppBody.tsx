import React, { useCallback, useEffect, useRef, useState } from "react"
import GlobalStyles from "@mui/material/GlobalStyles"
import { styled, useTheme } from "@mui/material/styles"
import { SizeI } from "@vrkit-platform/models"
import { OverlayWindowLayoutEditor } from "../../components/overlay-window-layout-editor"
import { createClassNames } from "@vrkit-platform/shared-ui"
import { getLogger } from "@3fv/logger-proxy"
import Box from "@mui/material/Box"
import { Fill, flexAlign, FlexRow, FlexRowCenter, hasCls, OverflowHidden } from "@vrkit-platform/shared-ui"
import { useAppSelector } from "vrkit-app-renderer/services/store"
import { sharedAppSelectors } from "vrkit-app-renderer/services/store/slices/shared-app"
import clsx from "clsx"
import { isObject } from "@3fv/guard"
import { overlayWindowSelectors } from "../../services/store/slices/overlay-window"
import { EditorInfoScreenOverlayOUID, EditorInfoVROverlayOUID } from "@vrkit-platform/shared"
import {
  PluginComponentContainer
} from "../../components/plugin-component-container"
//import { IPluginComponentManager } from "@vrkit-platform/plugin-sdk"

const log = getLogger(__filename)
const { info, debug, warn, error } = log

const classPrefix = "overlayWindowBody"
const classNames = createClassNames(classPrefix, "root")

const OverlayAppBodyContentRoot = styled(Box, {
  name: "OverlayAppBodyContentRoot",
  label: "OverlayAppBodyContentRoot"
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

export default function OverlayWindowAppBody() {
  const theme = useTheme(),
    editorEnabled = useAppSelector(sharedAppSelectors.selectEditorEnabled),
    PluginComponent = useAppSelector(overlayWindowSelectors.selectOverlayComponent),
    isVR = window.location.hash.endsWith("VR"),
    isEditorInfo = [EditorInfoScreenOverlayOUID, EditorInfoVROverlayOUID].some(id => window.location.hash.includes(id)),
    isEditMode = editorEnabled,
    contentRef = useRef<HTMLDivElement>(),
    [size, setSize] = useState<SizeI>(null),
    // pluginClientManager = useService(PluginClientManager),
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
    )
  // PluginComponent = pluginClientManager.getReactComponent()

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
            fontFamily: theme.typography.fontFamily,
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
      
        <OverlayAppBodyContentRoot
          id="content"
          className={clsx(classNames.root)}
          ref={contentRef}
        >
          {!PluginComponent || size === null ? (
            <></>
          ) : (
            <PluginComponentContainer
              Component={PluginComponent}
              client={getVRKitPluginClient()}
              {...size}
            />
          )}
        </OverlayAppBodyContentRoot>
      
      {!isEditorInfo && isEditMode && isObject(size) ? (
        <OverlayWindowLayoutEditor
          editorEnabled={editorEnabled}
          size={size}
        />
      ) : (
        <></>
      )}
    </>
  )
}
