export const isProd = !isDev
//export const isDev = !isProd

export const isMac = process.platform === "darwin"
export const isLinux = process.platform === "linux"
export const isWindows = !isLinux && !isMac && process.platform === "win32"



export const RemoteDebugEnabled = isDev
export const RemoteDebugPort = 9229

//isDev && process.argv.some(it => it.includes("no-devtools")) ? true : undefined
export const AutoOpenDevToolsOverride = false

// "https://cdn.jsdelivr.net/gh/vrkit-platform/vrkit-plugin-manifest/plugins.json"
export const PluginManifestsURL = "https://raw.githubusercontent.com/vrkit-platform/vrkit-plugin-manifest/refs/heads/master/plugins.json"