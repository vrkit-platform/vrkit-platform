import { type SessionEventData } from "../RPC"
import { type OneofKindType } from "../utils"

export type SessionEventPayloadType = SessionEventData["payload"]
export type SessionEventPayloadDataFrameType = Extract<SessionEventPayloadType, { oneofKind: "sessionDataFrame" }>

export function IsSessionDataFrameType(
    sessionEventPayload: SessionEventData["payload"]
): sessionEventPayload is SessionEventPayloadDataFrameType {
  return !sessionEventPayload ? false : sessionEventPayload.oneofKind === "sessionDataFrame"
}

export function GetSessionEventPayloadType<Type extends SessionEventData["payload"]["oneofKind"],
    Value extends OneofKindType<SessionEventData["payload"],Type> = OneofKindType<SessionEventData["payload"],Type>>(
    type: Type,
    sessionEventPayload: SessionEventPayloadType
): Value | null {
  return sessionEventPayload?.oneofKind === type ? (sessionEventPayload as Value) : null
}