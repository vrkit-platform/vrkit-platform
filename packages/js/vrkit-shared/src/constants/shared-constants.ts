import { assert } from "../utils"

if (typeof isDev === "undefined") {
  const g:any = typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : null
  assert(!!g, "No global found")
  g["isDev"] = process.env.NODE_ENV !== "production"
}

export const isDevLocal = isDev

export const isElectron =
    typeof process !== "undefined" && process?.versions?.electron?.length > 0

export const AppName = "VRKit"