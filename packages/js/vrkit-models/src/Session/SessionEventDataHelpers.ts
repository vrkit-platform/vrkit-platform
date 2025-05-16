import { type SessionEventData } from "../RPC"
import { type OneofKindType } from "../utils"

export type SessionEventPayloadType = SessionEventData["payload"]

export function GetSessionEventPayloadType<Type extends SessionEventData["payload"]["oneofKind"],
    Value extends OneofKindType<SessionEventData["payload"],Type> = OneofKindType<SessionEventData["payload"],Type>>(
    type: Type,
    sessionEventPayload: SessionEventPayloadType
): Value | null {
  return sessionEventPayload?.oneofKind === type ? (sessionEventPayload as Value) : null
}