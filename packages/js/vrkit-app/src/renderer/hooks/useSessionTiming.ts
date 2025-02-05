import { useCallback, useEffect, useState } from "react"
import { useService } from "../components/service-container"
import { SessionManagerClient } from "../services/session-manager-client"
import { SessionTiming } from "@vrkit-platform/models"
import { SessionManagerEventType } from "@vrkit-platform/shared"
import { getLogger } from "@3fv/logger-proxy"

const log = getLogger(__filename)

/**
 * Provides access to current session info
 */
export function useSessionTiming() {
  const client = useService(SessionManagerClient),
    [sessionTiming, setSessionTiming] = useState<SessionTiming>(null)
  
  useEffect(() => {
    const handleTimingChanged = (_client: SessionManagerClient, timing: SessionTiming) => {
      if (timing)
        setSessionTiming(timing)
    }
    client.on(SessionManagerEventType.TIMING_CHANGED, handleTimingChanged)
    return () => {
      client.off(SessionManagerEventType.TIMING_CHANGED, handleTimingChanged)
    }
  }, [client])
  
  
  
  return sessionTiming
}
