import "vrkit-plugin-sdk"
import { PluginClientComponentProps } from "vrkit-plugin-sdk"
import React, { useEffect, useRef, useState } from "react"
import TrackMapOverlayCanvasRenderer from "./TrackMapOverlayCanvasRenderer"

function TrackMapOverlayPlugin(props: PluginClientComponentProps) {
  const { client, width, height } = props,
    canvasRef = useRef<HTMLCanvasElement>(),
    [renderer, setRenderer] = useState<TrackMapOverlayCanvasRenderer>(null)

  useEffect(() => {
    const cleanup = () => {
      if (renderer) renderer.destroy()
    }
    if (canvasRef.current) {
      if (!renderer) {
        setRenderer(new TrackMapOverlayCanvasRenderer(canvasRef.current, width, height))
      } else {
        renderer.setSize(width, height)
      }
    }

    return cleanup
  }, [canvasRef.current, width, height])

  return (
    <canvas
      // width={width}
      // height={height}
      ref={canvasRef}
    />
  )
}

export default TrackMapOverlayPlugin
