import { app } from "electron"


if (typeof isDev === "undefined") {
  const g:any = typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : null
  if(!g) throw Error("No global found")
  g["isDev"] = process.env.NODE_ENV !== "production"
}

export const isDevLocal = isDev

export const isElectron =
    typeof process !== "undefined" && process?.versions?.electron?.length > 0

 // || /electron(\.exe)?$/.test(process.execPath)
export const isPackaged = app?.isPackaged ?? false
export const AppName = !isPackaged || isDev ? "VRKitDev" : "VRKit"
