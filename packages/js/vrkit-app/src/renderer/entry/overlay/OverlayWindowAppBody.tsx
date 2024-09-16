import "!!style-loader!css-loader!sass-loader!assets/css/fonts/fonts.global.scss"
import React, { useCallback, useEffect, useRef, useState } from "react"
import GlobalStyles from "@mui/material/GlobalStyles"
import { useTheme } from "@mui/material/styles"
import { PluginClientManager } from "vrkit-app-renderer/services/overlay-client"
import { useService } from "vrkit-app-renderer/components/service-container"
import { SizeI } from "vrkit-models"
import { OverlayConfigEditor } from "./components/overlay-config-editor"
import { useConstant } from "vrkit-app-renderer/hooks"

export default function OverlayWindowAppBody() {
  const theme = useTheme(),
    contentRef = useRef<HTMLDivElement>(),
    [size, setSize] = useState<SizeI>(null),
    pluginClientManager = useService(PluginClientManager),
    PluginComponent = pluginClientManager.getReactComponent(),
      resizeCallback = useCallback((entries: ResizeObserverEntry[]) => {
        if (!entries.length)
          return
        
        const { offsetWidth: width, offsetHeight: height } = entries[0].target as HTMLCanvasElement
        setSize({width, height})
      }, [setSize])
      
  useEffect(() => {
    if (!contentRef.current)
      return
    
    const observer = new ResizeObserver(resizeCallback)
    observer.observe(contentRef.current, {
      box: "border-box"
    })
    
    return () => {
      observer.disconnect()
    }
  }, [contentRef.current, resizeCallback])

  return (
    <>
      <GlobalStyles
        styles={{
          body: {
            backgroundColor: "#00000000" //theme.palette.background.gradient,
            // backgroundImage: theme.palette.background.gradientImage
          }
        }}
      />
      <div
        id="content"
        ref={contentRef}
      >
        {size && (
          <PluginComponent
            client={getVRKitPluginClient()}
            {...size}
          />
        )}
        <OverlayConfigEditor />
      </div>
    </>
  )
}
