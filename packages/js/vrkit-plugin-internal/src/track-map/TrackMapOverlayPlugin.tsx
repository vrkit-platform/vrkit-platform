import type { IPluginComponentProps } from "@vrkit-platform/plugin-sdk"
import React, { useEffect, useState } from "react"
import TrackMapOverlayCanvasRenderer from "./TrackMapOverlayCanvasRenderer"

let renderer: TrackMapOverlayCanvasRenderer = null

function TrackMapOverlayPlugin(props: IPluginComponentProps) {
  const { client, width, height } = props,
    inActiveSession = client.inActiveSession(),
    weekendInfo = client.getSessionInfo()?.weekendInfo,
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
//inActiveSession && weekendInfo ?
  return <canvas ref={ref => setCanvasRef(ref)} />
}

export default TrackMapOverlayPlugin as React.ComponentType<IPluginComponentProps>
