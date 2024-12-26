import type {} from "@vrkit-platform/shared"
import { app } from "electron"
import { RemoteDebugPort } from "./constants"
import { getLogger } from "@3fv/logger-proxy"

if (!isDev) {
  const sourceMapSupport = require("source-map-support")
  sourceMapSupport.install()
}

const log = getLogger(__filename)
const { debug, trace, info, error, warn } = log


if (isDev) {
  // REMOTE DEBUGGING PORT
  app.commandLine.appendSwitch(
      "remote-debugging-port",
      RemoteDebugPort.toString()
  )
  
  // USER DATA PATH FOR DEV
  const currentUserData = app.getPath("userData")
  console.debug(`Default userData path: %s`, currentUserData)
  
  // const currentName = Path.basename(currentUserData),
  //     appName = "VRKit"
  //
  // asOption(currentName)
  //     .tapIf(notEqualTo(appName), () => {
  //       const isElectronDefaultDir = currentName.endsWith("Electron")
  //       if (isElectronDefaultDir && process.platform === "darwin") {
  //       const newUserData = currentUserData + "VRKit"
  //       console.debug(`Using user data path: %s`, newUserData)
  //       mkdir("-p", newUserData)
  //       app.setPath("userData", newUserData)
  //       }
  //
  //       app.on("window-all-closed", (e?: any) => {
  //         console.info(`Received 'window-all-closed`)
  //         e?.preventDefault?.()
  //       })
  //     })
  //
  
}

app.setName("VRKit")
