import { useEffect, useState } from "react"
import type { IPluginClientEventArgs, PluginClientEventType } from "../../../PluginClient"
import { useVRKitPluginClient } from "./useVRKitPluginClient"

const log = console

export type VRKitPluginClientEventListenerState<T extends PluginClientEventType> = {
  type: T
  handler: IPluginClientEventArgs[T]
  attached: boolean
}

/**
 * Attaches a React node to `IPluginClient` (using `getVRKitPluginClient()`)
 *
 * @param type
 * @param handler
 */
export function useVRKitPluginClientEvent<T extends PluginClientEventType>(
  type: T,
  handler: IPluginClientEventArgs[T]
) {
  const [listenerState, setListenerState] = useState<VRKitPluginClientEventListenerState<T>>({
      attached: false,
      type,
      handler
    }),
    client = useVRKitPluginClient()

  useEffect(() => {
    client.on<T>(type, handler)
    setListenerState(state => ({ ...state, attached: true }))
    return () => {
      client.off<T>(type, handler)
      setListenerState(state => ({ ...state, attached: false }))
    }
  }, [client, type, handler])

  return listenerState
}
