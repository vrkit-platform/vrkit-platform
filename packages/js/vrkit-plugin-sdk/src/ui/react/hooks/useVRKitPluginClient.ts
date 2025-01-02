import { useMemo } from "react"

export function useVRKitPluginClient() {
  return useMemo(() => getVRKitPluginClient(), [])
}
