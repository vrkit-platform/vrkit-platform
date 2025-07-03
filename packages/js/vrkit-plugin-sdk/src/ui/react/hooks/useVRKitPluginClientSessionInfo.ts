import { useCallback, useEffect, useState } from "react"
import { PluginClientEventType } from "../../../PluginClient"
import type { SessionInfoMessage } from "../../../SessionInfoTypes"
import { useVRKitPluginClient } from "./useVRKitPluginClient"
import { useVRKitPluginClientEvent } from "./useVRKitPluginClientEvent"
import type { SessionMetadata } from "@vrkit-platform/models"

const log = console

/**
 * Provides access to current session info
 */
export function useVRKitPluginClientSessionInfo() {
  const client = useVRKitPluginClient(),
    [data, setData] = useState<[number,SessionMetadata,SessionInfoMessage]>([null,null,null]),
    handleSessionChange = useCallback(
      (sessionId: number, metadata:SessionMetadata, info: SessionInfoMessage) => {
        log.info(`useVRKitPluginClientSessionInfo() changed: ${sessionId}`, metadata, info)
        setData([sessionId, metadata, info])
      },
      [client]
    )

  // ATTACH TO EVENTS
  Array<PluginClientEventType>(
    PluginClientEventType.SESSION_INFO_CHANGED,
    PluginClientEventType.SESSION_ID_CHANGED
  ).map(type => useVRKitPluginClientEvent(type, handleSessionChange))
  
  useEffect(() => {
      if (!data) {
        setData([client.getSessionId(), client.getSessionMetadata(), client.getSessionInfo()])
      }
  }, [])
  
  return data
}
