// @generated by protobuf-ts 2.9.4
// @generated from protobuf file "RPC/Events/SessionEvent.proto" (package "IRacingTools.Models.RPC.Events", syntax proto3)
// tslint:disable
import type { BinaryWriteOptions } from "@protobuf-ts/runtime";
import type { IBinaryWriter } from "@protobuf-ts/runtime";
import { WireType } from "@protobuf-ts/runtime";
import type { BinaryReadOptions } from "@protobuf-ts/runtime";
import type { IBinaryReader } from "@protobuf-ts/runtime";
import { UnknownFieldHandler } from "@protobuf-ts/runtime";
import type { PartialMessage } from "@protobuf-ts/runtime";
import { reflectionMergePartial } from "@protobuf-ts/runtime";
import { MessageType } from "@protobuf-ts/runtime";
import { SessionData } from "../../Session/SessionState";
import { SessionTiming } from "../../Session/SessionState";
import { SessionType } from "../../Session/SessionState";
/**
 * @generated from protobuf message IRacingTools.Models.RPC.Events.SessionEventData
 */
export interface SessionEventData {
    /**
     * @generated from protobuf field: string id = 1;
     */
    id: string;
    /**
     * @generated from protobuf field: IRacingTools.Models.RPC.Events.SessionEventType type = 2;
     */
    type: SessionEventType;
    /**
     * @generated from protobuf field: string session_id = 10;
     */
    sessionId: string;
    /**
     * @generated from protobuf field: IRacingTools.Models.Session.SessionType session_type = 11;
     */
    sessionType: SessionType;
    /**
     * @generated from protobuf field: IRacingTools.Models.Session.SessionTiming session_timing = 15;
     */
    sessionTiming?: SessionTiming;
    /**
     * @generated from protobuf field: IRacingTools.Models.Session.SessionData session_data = 20;
     */
    sessionData?: SessionData;
}
/**
 * @generated from protobuf enum IRacingTools.Models.RPC.Events.SessionEventType
 */
export enum SessionEventType {
    /**
     * @generated from protobuf enum value: SESSION_EVENT_TYPE_UNKNOWN = 0;
     */
    UNKNOWN = 0,
    /**
     * @generated from protobuf enum value: SESSION_EVENT_TYPE_AVAILABLE = 1;
     */
    AVAILABLE = 1,
    /**
     * @generated from protobuf enum value: SESSION_EVENT_TYPE_INFO_CHANGED = 2;
     */
    INFO_CHANGED = 2,
    /**
     * @generated from protobuf enum value: SESSION_EVENT_TYPE_DATA_FRAME = 3;
     */
    DATA_FRAME = 3,
    /**
     * @generated from protobuf enum value: SESSION_EVENT_TYPE_TIMING_CHANGED = 4;
     */
    TIMING_CHANGED = 4
}
// @generated message type with reflection information, may provide speed optimized methods
class SessionEventData$Type extends MessageType<SessionEventData> {
    constructor() {
        super("IRacingTools.Models.RPC.Events.SessionEventData", [
            { no: 1, name: "id", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 2, name: "type", kind: "enum", T: () => ["IRacingTools.Models.RPC.Events.SessionEventType", SessionEventType, "SESSION_EVENT_TYPE_"] },
            { no: 10, name: "session_id", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 11, name: "session_type", kind: "enum", T: () => ["IRacingTools.Models.Session.SessionType", SessionType, "SESSION_TYPE_"] },
            { no: 15, name: "session_timing", kind: "message", T: () => SessionTiming },
            { no: 20, name: "session_data", kind: "message", T: () => SessionData }
        ]);
    }
    create(value?: PartialMessage<SessionEventData>): SessionEventData {
        const message = globalThis.Object.create((this.messagePrototype!));
        message.id = "";
        message.type = 0;
        message.sessionId = "";
        message.sessionType = 0;
        if (value !== undefined)
            reflectionMergePartial<SessionEventData>(this, message, value);
        return message;
    }
    internalBinaryRead(reader: IBinaryReader, length: number, options: BinaryReadOptions, target?: SessionEventData): SessionEventData {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* string id */ 1:
                    message.id = reader.string();
                    break;
                case /* IRacingTools.Models.RPC.Events.SessionEventType type */ 2:
                    message.type = reader.int32();
                    break;
                case /* string session_id */ 10:
                    message.sessionId = reader.string();
                    break;
                case /* IRacingTools.Models.Session.SessionType session_type */ 11:
                    message.sessionType = reader.int32();
                    break;
                case /* IRacingTools.Models.Session.SessionTiming session_timing */ 15:
                    message.sessionTiming = SessionTiming.internalBinaryRead(reader, reader.uint32(), options, message.sessionTiming);
                    break;
                case /* IRacingTools.Models.Session.SessionData session_data */ 20:
                    message.sessionData = SessionData.internalBinaryRead(reader, reader.uint32(), options, message.sessionData);
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message: SessionEventData, writer: IBinaryWriter, options: BinaryWriteOptions): IBinaryWriter {
        /* string id = 1; */
        if (message.id !== "")
            writer.tag(1, WireType.LengthDelimited).string(message.id);
        /* IRacingTools.Models.RPC.Events.SessionEventType type = 2; */
        if (message.type !== 0)
            writer.tag(2, WireType.Varint).int32(message.type);
        /* string session_id = 10; */
        if (message.sessionId !== "")
            writer.tag(10, WireType.LengthDelimited).string(message.sessionId);
        /* IRacingTools.Models.Session.SessionType session_type = 11; */
        if (message.sessionType !== 0)
            writer.tag(11, WireType.Varint).int32(message.sessionType);
        /* IRacingTools.Models.Session.SessionTiming session_timing = 15; */
        if (message.sessionTiming)
            SessionTiming.internalBinaryWrite(message.sessionTiming, writer.tag(15, WireType.LengthDelimited).fork(), options).join();
        /* IRacingTools.Models.Session.SessionData session_data = 20; */
        if (message.sessionData)
            SessionData.internalBinaryWrite(message.sessionData, writer.tag(20, WireType.LengthDelimited).fork(), options).join();
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message IRacingTools.Models.RPC.Events.SessionEventData
 */
export const SessionEventData = new SessionEventData$Type();
