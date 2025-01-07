import Path from "path"
import Fs from "fs-extra"
import JSON5 from "json5"
import { getLogger } from "@3fv/logger-proxy"
import { DevSettings } from "./DevSettings"
const log = getLogger(__filename)
let loadedDevSettings: DevSettings = null

export function newDevSettings(overrideDevSettings: Partial<DevSettings> = {}): DevSettings {
  if (loadedDevSettings) {
    return { ...loadedDevSettings, ...overrideDevSettings }
  }

  const workingDir = process.cwd(),
    parts = workingDir.split(/[\\\/]/),
    treePaths = Array<string>(),
    devSettings: DevSettings = {
      alwaysOpenDevTools: false,
      imageSequenceCapture: false,
      workspaceSourcePaths: []
    }

  while (parts.length) {
    const dir = Path.join(...parts),
      file = Path.join(dir, ".vrkit-dev.json"),
        localFile = Path.join(dir, ".vrkit-dev.local.json"),
        paths = [file, localFile].filter(f => Fs.existsSync(f))
    
    
    if (paths.length) {
      paths.forEach(f => {
        const diskDevSettings = JSON5.parse(Fs.readFileSync(f, "utf-8"))
        log.info(`Loaded DevSettings from ${f}`, diskDevSettings)
        Object.assign(devSettings, diskDevSettings)
      })
      break
    }

    parts.pop()
  }

  loadedDevSettings = { ...devSettings }
  return Object.assign(devSettings, overrideDevSettings)
}