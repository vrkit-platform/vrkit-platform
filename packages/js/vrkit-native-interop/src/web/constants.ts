import "./global"

export const isDev = process.env.NODE_ENV !== "production"

const nativeDebugEnabledEnv = process.env.VRKIT_NATIVE_DEBUG_ENABLED
export const isNativeDebugEnabled = typeof nativeDebugEnabledEnv === "string" && nativeDebugEnabledEnv.length > 0

const g = global as any
if (g.isDev === undefined) {
  g.isDev = isDev
}