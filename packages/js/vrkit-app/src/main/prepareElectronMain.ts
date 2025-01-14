import type {} from "@vrkit-platform/shared"
import { app, crashReporter } from "electron"
import { RemoteDebugPort } from "./constants"
import Path from "path"
import Fsx from "fs-extra"

const crashPath = Path.join(process.env.USERPROFILE, "Desktop", "vrkit","crashes")
Fsx.mkdirpSync(crashPath)
console.log(`Using crash dump path: ${crashPath}`)
app.setPath("crashDumps", crashPath)
crashReporter.start({
  uploadToServer: false
})

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
