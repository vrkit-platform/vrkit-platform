// import { useCallback, useEffect, useState } from "react"
// // import { useService } from "../components/service-container"
// // import { SessionManagerClient } from "../services/session-manager-client"
// import { SessionTiming } from "@vrkit-platform/models"
// import { SessionManagerEventType } from "@vrkit-platform/shared"
// import { useVRKitPluginClient } from "./useVRKitPluginClient"
// import type { SessionInfoMessage } from "../../../SessionInfoTypes"
// import { PluginClientEventType } from "../../../PluginClient"
// import { useVRKitPluginClientEvent } from "./useVRKitPluginClientEvent"
// // import { getLogger } from "@3fv/logger-proxy"
//
// //const log = getLogger(__filename)
//
// /**
//  * Provides access to current session info
//  */
// export function useVRKitPluginClientSessionTiming() {
//   const client = useService(SessionManagerClient),
//     [sessionTiming, setSessionTiming] = useState<SessionTiming>(null)
//
//   useEffect(() => {
//     const handleTimingChanged = (_client: SessionManagerClient, timing: SessionTiming) => {
//       if (timing)
//         setSessionTiming(timing)
//     }
//     client.on(SessionManagerEventType.TIMING_CHANGED, handleTimingChanged)
//     return () => {
//       client.off(SessionManagerEventType.TIMING_CHANGED, handleTimingChanged)
//     }
//   }, [client])
//
//
//
//   return sessionTiming
//
//   const client = useVRKitPluginClient(),
//       [sessionInfo, setSessionInfo] = useState<SessionInfoMessage>(null),
//       handleSessionChange = useCallback(
//           (_sessionId: string, _info: SessionInfoMessage) => {
//             if (client)
//               setSessionInfo(client.getSessionInfo())
//           },
//           [client]
//       )
//
//   // ATTACH TO EVENTS
//   Array<PluginClientEventType>(
//       PluginClientEventType.SESSION_TIMING_CHANGED
//   ).map(type => useVRKitPluginClientEvent(type, handleSessionChange))
//
//   useEffect(() => {
//     if (!sessionInfo) {
//       setSessionInfo(client.getSessionInfo())
//     }
//   }, [])
//
//   return sessionInfo
// }

export {}