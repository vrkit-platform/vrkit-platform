// import assert from "assert"
// assert(process.platform === "win32", `VRKit is only usable on Windows 10/11`)

export const isDev = process.env.NODE_ENV !== "production"

export const isElectron =
    typeof process !== "undefined" && process?.versions?.electron?.length > 0

export const AppName = "VRKit"