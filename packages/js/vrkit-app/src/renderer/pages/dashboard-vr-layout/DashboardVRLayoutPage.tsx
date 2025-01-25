import { Rnd } from "react-rnd"
import { Page, PageProps } from "../../components/page"
import React, { useCallback, useMemo } from "react"
import { getLogger } from "@3fv/logger-proxy"
import { lighten, styled } from "@mui/material/styles"
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
import { OverlayInfo, OverlayPlacement, RectI } from "@vrkit-platform/models"
import { asOption } from "@3fv/prelude-ts"
import { DndProvider, useDrag, useDrop, XYCoord } from "react-dnd"
import { HTML5Backend } from "react-dnd-html5-backend"

const log = getLogger(__filename)
const { info, debug, warn, error } = log

const classPrefix = "dashboardVRLayoutPage"
const classes = createClassNames(classPrefix, "surface", "item", "itemDragging")
export const dashboardVRLayoutPageClasses = classes

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
      ...OverflowHidden
    }
  }
}))

enum EditorItemType {
  Overlay = "Overlay"
}

interface EditorItemProps extends BoxProps {
  info: OverlayInfo

  placement: OverlayPlacement

  surfaceRect: RectI
}

function EditorItem({ info, placement, surfaceRect, ...other }: EditorItemProps) {
  //const // itemRect = asOption(placement.vrLayout)
    //     .map(({pose, size}) => {
    //
    //       return RectI.create({
    //         x: pose.x
    //       })
    //     }),
    

  return (
    <Rnd
      bounds={`.${classes.surface}`}
      size={{
        width: this.state.width,
        height: this.state.height
      }}
      position={{
        x: this.state.x,
        y: this.state.y
      }}
      onDragStop={(e, d) => {
        this.setState({ x: d.x, y: d.y })
      }}
      onResize={(e, direction, ref, delta, position) => {
        this.setState({
          width: ref.offsetWidth,
          height: ref.offsetHeight,
          ...position
        })
      }}
    >
      {info.name}
    </Rnd>
  )
}

interface EditorSurfaceProps {
  rect: RectI
}

function EditorSurface({ rect, ...other }: EditorSurfaceProps) {
  // const moveItem = useCallback((id: string, left: number, top: number) => {
  //   // setBoxes(
  //   //     update(boxes, {
  //   //       [id]: {
  //   //         $merge: { left, top },
  //   //       },
  //   //     }),
  //   // )
  // }, [])
  //
  // const [, drop] = useDrop(
  //   () => ({
  //     accept: EditorItemType.Overlay,
  //     drop(item: OverlayPlacement, monitor) {
  //       const delta = monitor.getDifferenceFromInitialOffset() as XYCoord
  //       // const left = Math.round(item.left + delta.x)
  //       // const top = Math.round(item.top + delta.y)
  //       // moveItem(item.id, left, top)
  //       return undefined
  //     }
  //   }),
  //   [moveItem]
  // )

  return (
    <Box
      className={clsx(classes.surface)}
      sx={{
        left: rect.position.x,
        top: rect.position.y,
        ...dimensionConstraints(rect.size.width, rect.size.height)
      }}
    >
      Components go here...
    </Box>
  )
}

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
