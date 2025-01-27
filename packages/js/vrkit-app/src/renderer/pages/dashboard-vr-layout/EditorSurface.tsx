import { Rnd } from "react-rnd"
import React, { HTMLAttributes, useCallback, useLayoutEffect, useState } from "react"
import { getLogger } from "@3fv/logger-proxy"
import DragIcon from "@mui/icons-material/DragIndicator"
import { useDebounceCallback } from "usehooks-ts"
import clsx from "clsx"
import { dimensionConstraints, EllipsisBox, FlexScaleZero } from "@vrkit-platform/shared-ui"
import Box from "@mui/material/Box"
import {
  OverlayInfo,
  OverlayPlacement,
  PluginComponentDefinition,
  PositionI,
  RectI,
  SizeI,
  VRLayout
} from "@vrkit-platform/models"
import { asOption } from "@3fv/prelude-ts"
import {
  assign,
  ConvertScreenRectToVRLayout,
  ConvertVRLayoutToScreenRect,
  pairOf,
  tripleOf
} from "@vrkit-platform/shared"
import { useAppSelector } from "../../services/store"
import { sharedAppSelectors } from "../../services/store/slices/shared-app"
import { OverlayManagerClient } from "../../services/overlay-manager-client"
import { useService } from "../../components/service-container"
import { Alert } from "../../services/alerts"
import dashboardVRLayoutPageClasses from "./DashboardVRLayoutPageClasses"
import { PluginOverlayIcon } from "../../components/plugins"

const log = getLogger(__filename)
const { info, debug, warn, error } = log

const classes = dashboardVRLayoutPageClasses

export interface EditorItemProps extends Omit<HTMLAttributes<"div">, "component"> {
  info: OverlayInfo

  placement: OverlayPlacement

  component: PluginComponentDefinition

  surfaceSize: SizeI
}

export function EditorItem({ info, component, placement, surfaceSize, className, ...other }: EditorItemProps) {
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
        if (log.isDebugEnabled()) {
          log.debug(`onDragStop`, newItemRect)
        }

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

        if (log.isDebugEnabled()) {
          log.debug(`onResize`, newItemRect)
        }
        setItemRect(newItemRect)
        updateVRLayoutDebounced(placement.id, ConvertScreenRectToVRLayout(surfaceSize, newItemRect))
      }}
    >
      <Box className={clsx(classes.itemContent)}>
        <Box className={clsx(classes.itemContentHeader)}>
          <PluginOverlayIcon component={component} />
          <EllipsisBox sx={{ ...FlexScaleZero }}>{info.name}</EllipsisBox>
          <DragIcon />
        </Box>
      </Box>
    </Rnd>
  )
}

export interface EditorSurfaceProps {
  rect: RectI
}

export function EditorSurface({ rect, ...other }: EditorSurfaceProps) {
  const dash = useAppSelector(sharedAppSelectors.selectActiveDashboardConfig),
    components = useAppSelector(sharedAppSelectors.selectPluginComponentOverlayDefsMap)
  if (!dash || !components || !rect) {
    return null
  }

  const { overlays = [] } = dash,
    placementOverlayComps =
      dash.placements
        ?.filter(p => !!p.vrLayout && overlays.some(o => o.id === p.overlayId))
        .map(p =>
          pairOf(
            p,
            overlays.find(o => o.id === p.overlayId)
          )
        )
        .filter(([, o]) => !!components[o.componentId])
        .map(([p, o]) => tripleOf(p, o, components[o.componentId][1])) ?? []

  return (
    <Box
      className={clsx(classes.surface)}
      sx={{
        left: rect.position.x,
        top: rect.position.y,
        ...dimensionConstraints(rect.size.width, rect.size.height)
      }}
    >
      {placementOverlayComps.map(([p, o, c]) => (
        <EditorItem
          key={p.id}
          info={o}
          placement={p}
          component={c}
          surfaceSize={rect.size}
        />
      ))}
    </Box>
  )
}
