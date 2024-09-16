import { Router } from "vrkit-app-renderer/routes/sections"

import "!!style-loader!css-loader!sass-loader!assets/css/fonts/fonts.global.scss"
import React, { useEffect, useRef, useState } from "react"
import GlobalStyles from "@mui/material/GlobalStyles"
import { useTheme } from "@mui/material/styles"
import { PluginClientManager } from "vrkit-app-renderer/services/overlay-client"
import { useService } from "vrkit-app-renderer/components/service-container"
import Box from "@mui/material/Box"
import { SizeI } from "vrkit-models"

export default function OverlayWindowAppBody() {
  const theme = useTheme(),
      contentRef = useRef<HTMLDivElement>(),
      [size, setSize] = useState<SizeI>(null),
      pluginClientManager = useService(PluginClientManager),
      PluginComponent = pluginClientManager.getReactComponent()
  
  useEffect(() => {
    if (!contentRef.current)
      return
    
    const { offsetWidth:width, offsetHeight:height } = contentRef.current;
    setSize({width, height});
  }, [contentRef.current?.offsetWidth, contentRef.current?.offsetHeight]);
  
  return (
    <>
      <GlobalStyles
        styles={{
          body: {
            backgroundColor: "#00000000",//theme.palette.background.gradient,
            // backgroundImage: theme.palette.background.gradientImage
          }
        }}
      />
      <div id="content" ref={contentRef}>
        {size && <PluginComponent client={getVRKitPluginClient()} {...size}/>}
      </div>
    </>
  )
}
