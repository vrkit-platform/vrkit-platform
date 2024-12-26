export const isProd = !isDev
//export const isDev = !isProd

export const isMac = process.platform === "darwin"
export const isLinux = process.platform === "linux"
export const isWindows = !isLinux && !isMac && process.platform === "win32"

export const WindowSizeDefault = {
  width: 1200,
  height: 800
}

export const ZoomFactorIncrement = 0.15
export const ZoomFactorMin = 1
export const ZoomFactorMax = 2.25

export const RemoteDebugEnabled = isDev
export const RemoteDebugPort = 9229

export const AutoOpenDevToolsOverride = false //isDev && process.argv.some(it => it.includes("no-devtools")) ? true : undefined