import {
  IPluginComponentProps, useVRKitPluginClientSessionInfo
} from "@vrkit-platform/plugin-sdk"
import React, { useEffect, useState } from "react"
import TrackMapOverlayCanvasRenderer from "./TrackMapOverlayCanvasRenderer"

let renderer: TrackMapOverlayCanvasRenderer = null!
function cleanRenderer() {
  if (renderer) {
    renderer.destroy()
    renderer = null!
  }
}

function TrackMapOverlayPlugin(props: IPluginComponentProps) {
  const { client, width, height } = props,
    inActiveSession = client.inActiveSession(),
    [sessionId,metadata,sessionInfo] = useVRKitPluginClientSessionInfo(),
    weekendInfo = sessionInfo?.weekendInfo,
    
    [canvasRef, setCanvasRef] = useState<HTMLCanvasElement>(null!)
  console.info(`SessionId=${metadata?.sessionId}`)
  useEffect(cleanRenderer, [metadata?.sessionId])
  useEffect(() => {
    if (!inActiveSession || !weekendInfo) {
      return
    }
    
    if (canvasRef) {
      // if (renderer?.sessionId !== metadata?.sessionId) {
      //   cleanRenderer()
      // }
      if (!renderer) {
        renderer = new TrackMapOverlayCanvasRenderer(canvasRef, width, height)
      } else {
        renderer.reset(width, height)
      }
    }

    return cleanRenderer
  }, [canvasRef, width, height, inActiveSession, weekendInfo])

  useEffect(() => {
    return () => {
      cleanRenderer()
      setCanvasRef(null!)
    }
  }, [])
//inActiveSession && weekendInfo ?
  return <canvas ref={ref => setCanvasRef(ref!)} />
}

export default TrackMapOverlayPlugin as React.ComponentType<IPluginComponentProps>
