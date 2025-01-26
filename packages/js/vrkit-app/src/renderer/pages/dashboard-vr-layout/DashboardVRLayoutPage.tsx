import { Rnd } from "react-rnd"
import { Page, PageProps } from "../../components/page"
import React, { useCallback, useLayoutEffect, useMemo, useState } from "react"
import { getLogger } from "@3fv/logger-proxy"
import { lighten, styled } from "@mui/material/styles"
import { useDebounceCallback } from 'usehooks-ts'
import clsx from "clsx"
import {
  child,
  createClassNames,
  dimensionConstraints,
  FlexColumnCenter,
  FlexScaleZero,
  OverflowHidden,
  OverflowVisible,
  PositionAbsolute,
  PositionRelative
} from "@vrkit-platform/shared-ui"
import Box, { BoxProps } from "@mui/material/Box"
import { useResizeObserver } from "../../hooks"
import { isNumber } from "@3fv/guard"
import {
  OverlayInfo, OverlayPlacement, PositionI, RectI, SizeI, VRLayout
} from "@vrkit-platform/models"
import { asOption } from "@3fv/prelude-ts"
import { DndProvider, useDrag, useDrop, XYCoord } from "react-dnd"
import { HTML5Backend } from "react-dnd-html5-backend"
import {
  assign, ConvertScreenRectToVRLayout, ConvertVRLayoutToScreenRect, pairOf
} from "@vrkit-platform/shared"
import { useAppSelector } from "../../services/store"
import { sharedAppSelectors } from "../../services/store/slices/shared-app"
import { OverlayManagerClient } from "../../services/overlay-manager-client"
import { useService } from "../../components/service-container"
import { Alert } from "../../services/alerts"
import dashboardVRLayoutPageClasses from "./DashboardVRLayoutPageClasses"
import { EditorSurface } from "./EditorSurface"

const log = getLogger(__filename)
const { info, debug, warn, error } = log

const classes = dashboardVRLayoutPageClasses

const DashboardVRLayoutPageRoot = styled(Box, {
  name: "DashboardVRLayoutPageRoot"
})(({ theme }) => ({
  ...PositionRelative,
  ...FlexScaleZero,
  ...OverflowHidden,
  ...FlexColumnCenter,
  [child(classes.surface)]: {
    ...OverflowVisible,
    ...PositionAbsolute,
    border: `3px solid ${theme.palette.primary.main}`,
    borderRadius: theme.shape.borderRadius,
    backgroundColor: lighten(theme.palette.primary.main, 0.35),
    [child(classes.item)]: {
      ...PositionAbsolute,
      ...OverflowHidden,
      border: `1px solid ${theme.palette.secondary.main}`,
      backgroundColor: theme.palette.secondary.main,
      borderRadius: theme.shape.borderRadius,
    }
  }
}))

export interface DashboardVRLayoutPageProps extends PageProps {}

export function DashboardVRLayoutPage({ className, ...other }: DashboardVRLayoutPageProps) {
  const [contentRef, size] = useResizeObserver(),
    surfaceRect = useMemo<RectI>(
      () =>
        !size
          ? null
          : asOption(Math.min(...Object.values(size).filter(isNumber)))
              .filter(dim => dim >= 100)
              .map(dim => Math.floor(dim * 0.97))
              .map(dim => {
                return RectI.create({
                  size: {
                    width: dim,
                    height: dim
                  },
                  position: {
                    x: (size.width - dim) / 2,
                    y: (size.height - dim) / 2
                  }
                })
              })
              .getOrCall(() => {
                log.warn(`Invalid dimension detected, must be > 100`)
                return null
              }),

      [size]
    )
  log.info("VR Layout Editor Content Size", size)
  return (
    <Page
      metadata={{
        title: "VR Layout Editor"
      }}
    >
      <DashboardVRLayoutPageRoot ref={contentRef}>
        <If condition={!!surfaceRect}>
          <DndProvider backend={HTML5Backend}>
            <EditorSurface rect={surfaceRect} />
          </DndProvider>
        </If>
      </DashboardVRLayoutPageRoot>
    </Page>
  )
}

export default DashboardVRLayoutPage
