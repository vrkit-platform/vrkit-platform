import { Rnd } from "react-rnd"
import React, { useCallback, useLayoutEffect, useState } from "react"
import { getLogger } from "@3fv/logger-proxy"
import { lighten, styled } from "@mui/material/styles"
import { useDebounceCallback } from "usehooks-ts"
import clsx from "clsx"
import {
  child,
  dimensionConstraints,
  FlexColumnCenter,
  FlexScaleZero,
  OverflowHidden,
  OverflowVisible,
  PositionAbsolute,
  PositionRelative
} from "@vrkit-platform/shared-ui"
import Box, { BoxProps } from "@mui/material/Box"
import { OverlayInfo, OverlayPlacement, PositionI, RectI, SizeI, VRLayout } from "@vrkit-platform/models"
import { asOption } from "@3fv/prelude-ts"
import { assign, ConvertScreenRectToVRLayout, ConvertVRLayoutToScreenRect, pairOf } from "@vrkit-platform/shared"
import { useAppSelector } from "../../services/store"
import { sharedAppSelectors } from "../../services/store/slices/shared-app"
import { OverlayManagerClient } from "../../services/overlay-manager-client"
import { useService } from "../../components/service-container"
import { Alert } from "../../services/alerts"
import dashboardVRLayoutPageClasses from "./DashboardVRLayoutPageClasses"

const log = getLogger(__filename)
const { info, debug, warn, error } = log

const classes = dashboardVRLayoutPageClasses

export interface EditorItemProps extends BoxProps {
  info: OverlayInfo

  placement: OverlayPlacement

  surfaceSize: SizeI
}

export function EditorItem({ info, placement, surfaceSize, className, ...other }: EditorItemProps) {
  const [itemRect, setItemRect] = useState<RectI>(null),
    overlayManagerClient = useService(OverlayManagerClient),
    updateVRLayout = useCallback(
      (placementId: string, vrLayout: VRLayout) => {
        overlayManagerClient.setVRLayout(placementId, vrLayout).catch(err => {
          const msg = `Unable to update VRLayout for placement (${placementId})`
          log.error(msg, err)
          Alert.error(msg)
        })
      },
      [overlayManagerClient]
    ),
    updateVRLayoutDebounced = useDebounceCallback(updateVRLayout, 250, {
      leading: true,
      trailing: true
    })

  useLayoutEffect(() => {
    const newItemRect = asOption(placement.vrLayout)
      .map(vrLayout => ConvertVRLayoutToScreenRect(surfaceSize, vrLayout))
      .getOrNull()
    if (newItemRect) {
      setItemRect(newItemRect)
    }
  }, [surfaceSize, placement?.id])

  return !itemRect ? null : (
    <Rnd
      bounds={`.${classes.surface}`}
      className={clsx(classes.item, className)}
      size={{
        width: itemRect.size.width,
        height: itemRect.size.height
      }}
      position={{
        x: itemRect.position.x,
        y: itemRect.position.y
      }}
      onDragStop={(e, d) => {
        const newItemRect = assign(RectI.clone(itemRect), {
          position: PositionI.create({
            x: d.x,
            y: d.y
          })
        })
        log.info(`onDragStop`, newItemRect)

        setItemRect(newItemRect)
        updateVRLayoutDebounced(placement.id, ConvertScreenRectToVRLayout(surfaceSize, newItemRect))
      }}
      onResize={(e, direction, ref, delta, position) => {
        const newItemRect = assign(RectI.clone(itemRect), {
          size: SizeI.create({
            width: ref.offsetWidth,
            height: ref.offsetHeight
          })
        })

        log.info(`onResize`, newItemRect)
        setItemRect(newItemRect)
        updateVRLayoutDebounced(placement.id, ConvertScreenRectToVRLayout(surfaceSize, newItemRect))
      }}
    >
      {info.name}
    </Rnd>
  )
}

export interface EditorSurfaceProps {
  rect: RectI
}

export function EditorSurface({ rect, ...other }: EditorSurfaceProps) {
  const dash = useAppSelector(sharedAppSelectors.selectActiveDashboardConfig),
    { overlays = [] } = dash,
    placementOverlays =
      dash.placements
        ?.filter(p => !!p.vrLayout && overlays.some(o => o.id === p.overlayId))
        .map(p =>
          pairOf(
            p,
            overlays.find(o => o.id === p.overlayId)
          )
        ) ?? []

  return (
    <Box
      className={clsx(classes.surface)}
      sx={{
        left: rect.position.x,
        top: rect.position.y,
        ...dimensionConstraints(rect.size.width, rect.size.height)
      }}
    >
      {placementOverlays.map(([p, o]) => (
        <EditorItem
          key={p.id}
          info={o}
          placement={p}
          surfaceSize={rect.size}
        />
      ))}
    </Box>
  )
}
