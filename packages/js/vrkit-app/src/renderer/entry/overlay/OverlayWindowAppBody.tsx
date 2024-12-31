import React from "react"
import GlobalStyles from "@mui/material/GlobalStyles"
import { styled, useTheme } from "@mui/material/styles"
import { OverlayWindowLayoutEditor } from "../../components/overlay-window-layout-editor"
import {
  createClassNames,
  Fill,
  flexAlign,
  FlexRow,
  FlexRowCenter,
  hasCls,
  OverflowHidden
} from "@vrkit-platform/shared-ui"
import { getLogger } from "@3fv/logger-proxy"
import Box from "@mui/material/Box"

import clsx from "clsx"
import { isObject } from "@3fv/guard"
import { EditorInfoScreenOverlayOUID, EditorInfoVROverlayOUID } from "@vrkit-platform/shared"
import { overlayWindowSelectors } from "../../services/store/slices/overlay-window"
import { useAppSelector } from "../../services/store"
import { sharedAppSelectors } from "../../services/store/slices/shared-app"

import { PluginComponentContainer } from "../../components/plugin-component-container"
import { useResizeObserver } from "../../hooks/useResizeObserver"
import ErrorBoundary from "../../components/error-boundary"

const log = getLogger(__filename)
const { info, debug, warn, error } = log

const classPrefix = "overlayAppBody"
const classes = createClassNames(classPrefix, "root")

const OverlayAppBodyContentRoot = styled(Box, {
  name: "OverlayAppBodyContentRoot",
  label: "OverlayAppBodyContentRoot"
})(({ theme }) => ({
  [hasCls(classes.root)]: {
    position: "relative",
    objectFit: "contain",
    ...FlexRowCenter,
    ...Fill
  }
}))

export default function OverlayWindowAppBody() {
  const theme = useTheme(),
    isEditMode = useAppSelector(sharedAppSelectors.selectEditorEnabled),
    PluginComponent = useAppSelector(overlayWindowSelectors.selectOverlayComponent),
    isEditorInfo = [EditorInfoScreenOverlayOUID, EditorInfoVROverlayOUID].some(id => window.location.hash.includes(id)),
    [contentRef, size] = useResizeObserver()

  return (
    <>
      <GlobalStyles
        styles={{
          body: {
            fontFamily: theme.typography.fontFamily,
            backgroundColor: "#00000000",
            ...OverflowHidden,
            ...Fill,
            "& > #root": {
              ...OverflowHidden,
              ...FlexRow,
              ...flexAlign("stretch", "stretch")
            }
          }
        }}
      />
      <ErrorBoundary>
        <OverlayAppBodyContentRoot
          id="content"
          className={clsx(classes.root)}
          ref={contentRef}
        >
          <If condition={!!PluginComponent && !!size}>
            <PluginComponentContainer
              Component={PluginComponent}
              client={getVRKitPluginClient()}
              {...size}
            />
          </If>
        </OverlayAppBodyContentRoot>
      </ErrorBoundary>
      <If condition={!isEditorInfo && isEditMode && isObject(size)}>
        <OverlayWindowLayoutEditor
          editorEnabled={isEditMode}
          size={size}
        />
      </If>
    </>
  )
}
