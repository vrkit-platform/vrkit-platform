import type {} from "@vrkit-platform/shared"
import { app, crashReporter } from "electron"
import { AppName, RemoteDebugPort } from "./constants"
import Path from "path"
import Fsx from "fs-extra"

const log = (...args:any[]) => {
  if (isDev) {
    console.info(...args)
  }
}
// SET THE NAME

app.setName(AppName)

// SETUP CRASH REPORTER
const crashPath = Path.join(process.env.USERPROFILE, "Desktop", "vrkit","crashes")
log(`CRASH PATH: ${crashPath}`)
Fsx.mkdirpSync(crashPath)
app.setPath("crashDumps", crashPath)
crashReporter.start({
  uploadToServer: false
})

if (isDev) {
  log(`PREPARE MAIN`)
  
  // REMOTE DEBUGGING PORT
  app.commandLine.appendSwitch(
      "remote-debugging-port",
      RemoteDebugPort.toString()
  )
  
  // USER DATA PATH FOR DEV
  const currentUserData = app.getPath("userData")
  log(`Default userData path: %s`, currentUserData)
} else {
  const sourceMapSupport = require("source-map-support")
  sourceMapSupport.install()
}



