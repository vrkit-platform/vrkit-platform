import type { PluginClientComponentProps } from "vrkit-plugin-sdk"
import React, { useEffect, useRef, useState } from "react"
import TrackMapOverlayCanvasRenderer from "./TrackMapOverlayCanvasRenderer"
import { sharedAppSelectors } from "../../services/store/slices/shared-app"
import { useAppSelector } from "../../services/store"
import { FlexRowCenterBox } from "../../components/box"

let renderer: TrackMapOverlayCanvasRenderer = null

function TrackMapOverlayPlugin(props: PluginClientComponentProps) {
  const { client, width, height } = props,
      inActiveSession = useAppSelector(sharedAppSelectors.hasActiveSession),
      weekendInfo = useAppSelector(sharedAppSelectors.selectActiveSessionWeekendInfo),
      
    [canvasRef, setCanvasRef] = useState<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!inActiveSession || !weekendInfo) {
      return
    }
    
    if (canvasRef) {
      if (!renderer) {
        renderer = new TrackMapOverlayCanvasRenderer(canvasRef, width, height)
      } else {
        renderer.reset(width, height)
      }
    }

    return () => {
      if (renderer) {
        renderer.destroy()
        renderer = null
      }
    }
  }, [canvasRef, renderer, width, height, inActiveSession, weekendInfo])
  
  useEffect(() => {
    return () => {
      if (renderer) {
        renderer.destroy()
        renderer = null
      }
      setCanvasRef(null)
    }
  }, [])
  
  return (inActiveSession && weekendInfo ?
    <canvas
      ref={ref => setCanvasRef(ref)}
    /> : <></>
          // <FlexRowCenterBox>No Active Session TODO: Make this pretty</FlexRowCenterBox>
  )
}

export default TrackMapOverlayPlugin
