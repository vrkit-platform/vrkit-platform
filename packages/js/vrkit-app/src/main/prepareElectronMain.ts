import type {} from "@vrkit-platform/shared"
import { app } from "electron"
import { RemoteDebugPort } from "./constants"

if (isDev) {
  console.info(`Preparing main entry`)
  
  // REMOTE DEBUGGING PORT
  app.commandLine.appendSwitch(
      "remote-debugging-port",
      RemoteDebugPort.toString()
  )
  
  // USER DATA PATH FOR DEV
  const currentUserData = app.getPath("userData")
  console.debug(`Default userData path: %s`, currentUserData)
} else {
  const sourceMapSupport = require("source-map-support")
  sourceMapSupport.install()
}


app.setName("VRKit")
