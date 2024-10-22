import { asOption } from "@3fv/prelude-ts"
import Path from "path"
import Fs from "fs"
import { assert, isNotEmpty } from "vrkit-shared"

assert(process.platform === "win32", `VRKit is only usable on Windows 10/11`);

const homeDir = asOption(process.env.USERPROFILE as string)
    .filter(isNotEmpty)
    .orElse(() => asOption(process.env.HOME as string))
    .filter(Fs.existsSync)
    .getOrThrow("Unable to find valid home directory")

export const AppName = "VRKit"

const appData = Path.join(homeDir, "AppData"," Roaming", AppName)
const appDataLocal = Path.join(homeDir, "AppData"," Local", AppName)
const trackMaps = Path.join(appDataLocal, "TrackMaps")

export const AppPaths = {
  home: homeDir,
  appDataLocal,
  appData,
  
}