import { useCallback, useEffect, useState } from "react"
import { PluginClientEventType } from "../../../PluginClient"
import type { SessionInfoMessage } from "../../../SessionInfoTypes"
import { useVRKitPluginClient } from "./useVRKitPluginClient"
import { useVRKitPluginClientEvent } from "./useVRKitPluginClientEvent"

const log = console

/**
 * Provides access to current session info
 */
export function useVRKitPluginClientSessionInfo() {
  const client = useVRKitPluginClient(),
    [sessionInfo, setSessionInfo] = useState<SessionInfoMessage>(null),
    handleSessionChange = useCallback(
      (_sessionId: string, _info: SessionInfoMessage) => {
        if (client)
          setSessionInfo(client.getSessionInfo())
      },
      [client]
    )

  // ATTACH TO EVENTS
  Array<PluginClientEventType>(
    PluginClientEventType.SESSION_INFO_CHANGED,
    PluginClientEventType.SESSION_ID_CHANGED
  ).map(type => useVRKitPluginClientEvent(type, handleSessionChange))
  
  useEffect(() => {
      if (!sessionInfo) {
        setSessionInfo(client.getSessionInfo())
      }
  }, [])
  
  return sessionInfo
}
