import Path from "path"
import JSON5 from "json5"
import Fs from "fs-extra"
import { getLogger } from "@3fv/logger-proxy"
export type NativeImageSequenceFormat = "raw" | "png"

const log = getLogger(__filename)
export const NativeImageSequenceFormats: NativeImageSequenceFormat[] = ["raw", "png"]

export type NativeImageSeqSettings =
  | false
  | {
      format: NativeImageSequenceFormat
      outputPath?: string
    }

export interface DevSettings {
  imageSequenceCapture: NativeImageSeqSettings | false

  alwaysOpenDevTools: boolean
}

export function newDevSettings(overrideDevSettings: Partial<DevSettings> = {}): DevSettings {
  const workingDir = process.cwd(),
    parts = workingDir.split(/\\\//),
    treePaths = Array<string>(),
    devSettings: DevSettings = {
      alwaysOpenDevTools: false,
      imageSequenceCapture: false

      //     {
      //   format: "raw", outputPath: "y:\\tmp\\cap"
      // }
    }

  while (parts.length) {
    const dir = Path.join(...parts),
      file = Path.join(dir, ".vrkit-dev.json")

    if (Fs.existsSync(file)) {
      const diskDevSettings = JSON5.parse(Fs.readFileSync(file, "utf-8"))
      log.info(`Loaded DevSettings from ${file}`, diskDevSettings)
      Object.assign(devSettings, diskDevSettings)

      break
    }

    parts.shift()
  }

  return Object.assign(devSettings, overrideDevSettings)
}
