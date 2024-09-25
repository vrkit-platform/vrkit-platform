import type { PluginClientComponentProps } from "vrkit-plugin-sdk"
import React, { useEffect, useRef, useState } from "react"
import TrackMapOverlayCanvasRenderer from "./TrackMapOverlayCanvasRenderer"

let renderer: TrackMapOverlayCanvasRenderer = null

function TrackMapOverlayPlugin(props: PluginClientComponentProps) {
  const { client, width, height } = props,
    [canvasRef, setCanvasRef] = useState<HTMLCanvasElement>(null)

  useEffect(() => {
    
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
  }, [canvasRef, renderer, width, height])
  
  useEffect(() => {
    return () => {
      if (renderer) {
        renderer.destroy()
        renderer = null
      }
      setCanvasRef(null)
    }
  }, [])
  
  return (
    <canvas
      // width={width}
      // height={height}
      ref={ref => setCanvasRef(ref)}
    />
  )
}

export default TrackMapOverlayPlugin
