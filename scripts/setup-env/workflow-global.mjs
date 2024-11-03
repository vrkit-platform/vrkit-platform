import Path from "path"
import {cd, fs as Fs, echo, within, usePwsh} from "zx"

if (process.platform === "win32") {
  usePwsh()
}

export const scriptsDir = Path.resolve(import.meta.dirname, "..")
export const rootDir = Path.dirname(scriptsDir),
  buildDir = Path.join(rootDir, "build"),
  buildElectronDir = Path.join(buildDir, "electron"),
  buildElectronWinDir = Path.join(buildElectronDir, "windows")

export const cppDir = Path.join(rootDir,"packages","cpp")
export const xrLayerDir = Path.join(cppDir, "lib-openxr-layer")

export const jsDir = Path.join(rootDir,"packages","js")
export const appDir = Path.join(jsDir,"vrkit-app")
export const pluginDefaultDir = Path.join(jsDir,"vrkit-plugin-internal")
export const nativeDir = Path.join(jsDir,"vrkit-native-interop")
export const nodeModulesBin = Path.join(rootDir, "node_modules", ".bin")
export const electronBuilderOutDir = Path.relative(appDir, buildElectronWinDir)

export const ElectronBuilderPaths = {
  openxrLayer: "resources/openxr-layer"
}

if (Fs.existsSync(nodeModulesBin)) {
  process.env.PATH = `${nodeModulesBin}${Path.sep}${process.env.PATH}`
}

