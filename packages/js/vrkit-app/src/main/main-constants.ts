import { app } from "electron"
import type { AutoOpenDevToolsTrigger } from "@vrkit-platform/shared"
import { asOption } from "@3fv/prelude-ts"

export const isPackaged = app.isPackaged
export const AppName = !isPackaged || isDev ? "VRKitDev" : "VRKit"

export const isProd = !isDev

export const isMac = process.platform === "darwin"
export const isLinux = process.platform === "linux"
export const isWindows = !isLinux && !isMac && process.platform === "win32"


export const RemoteDebugEnabled = isDev
export const RemoteDebugPort = 9229

//isDev && process.argv.some(it => it.includes("no-devtools")) ? true : undefined
export const AutoOpenDevToolsOverride:AutoOpenDevToolsTrigger = asOption(process.env.AUTO_OPEN_DEV_TOOLS_TRIGGER as AutoOpenDevToolsTrigger)
  .filter(trigger => !isDev ? false : Array<AutoOpenDevToolsTrigger>("never", "always", "only-floating", "only-normal").includes(trigger))
  .getOrElse("never")

// "https://cdn.jsdelivr.net/gh/vrkit-platform/vrkit-plugin-manifest/plugins.json"
export const PluginManifestsURL = "https://raw.githubusercontent.com/vrkit-platform/vrkit-plugin-manifest/refs/heads/master/plugins.json"