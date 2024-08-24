// @generated by protobuf-ts 2.9.4
// @generated from protobuf file "RPC/Messages/SimpleMessages.proto" (package "IRacingTools.Models.RPC.Messages", syntax proto3)
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
import { Any } from "../../google/protobuf/any";
/**
 * @generated from protobuf message IRacingTools.Models.RPC.Messages.PingMessage
 */
export interface PingMessage {
    /**
     * @generated from protobuf field: uint32 count = 1;
     */
    count: number;
}
/**
 * @generated from protobuf message IRacingTools.Models.RPC.Messages.PongMessage
 */
export interface PongMessage {
    /**
     * @generated from protobuf field: uint32 ping_count = 1;
     */
    pingCount: number;
}
/**
 * @generated from protobuf message IRacingTools.Models.RPC.Messages.ListMessage
 */
export interface ListMessage {
    /**
     * TARGET TO BE QUERIED; THIS CAN BE ANYTHING I.E. `dashboards`, `overlays`, ETC
     *  AS LONG AS YOUR ROUTE KNOWS WHAT TO LOOK FOR, ANY VALUE WORKS
     *
     * @generated from protobuf field: string subject = 1;
     */
    subject: string;
    /**
     * POTENTIALLY A FILTERING QUERY
     *
     * @generated from protobuf field: string query = 2;
     */
    query: string;
    // ARGUMENTS FOR QUERY
    // map<string, string> parameters = 5;

    /**
     * RESULT OR REQUEST
     *
     * @generated from protobuf field: bool is_result = 10;
     */
    isResult: boolean;
    /**
     * @generated from protobuf field: int32 results_page = 11;
     */
    resultsPage: number;
    /**
     * IF `results_per_page == -1` ALL RESULTS SHOULD BE RETURNED
     *
     * @generated from protobuf field: int32 results_per_page = 12;
     */
    resultsPerPage: number;
    /**
     * @generated from protobuf field: uint32 results_count = 13;
     */
    resultsCount: number;
    /**
     * `ANY[]` WITH RESULTS TO BE UNPACKED
     *
     * @generated from protobuf field: repeated google.protobuf.Any results = 20;
     */
    results: Any[];
    /**
     * ANY ERROR
     *
     * @generated from protobuf field: string error_details = 60;
     */
    errorDetails: string;
}
// @generated message type with reflection information, may provide speed optimized methods
class PingMessage$Type extends MessageType<PingMessage> {
    constructor() {
        super("IRacingTools.Models.RPC.Messages.PingMessage", [
            { no: 1, name: "count", kind: "scalar", T: 13 /*ScalarType.UINT32*/ }
        ]);
    }
    create(value?: PartialMessage<PingMessage>): PingMessage {
        const message = globalThis.Object.create((this.messagePrototype!));
        message.count = 0;
        if (value !== undefined)
            reflectionMergePartial<PingMessage>(this, message, value);
        return message;
    }
    internalBinaryRead(reader: IBinaryReader, length: number, options: BinaryReadOptions, target?: PingMessage): PingMessage {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* uint32 count */ 1:
                    message.count = reader.uint32();
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
    internalBinaryWrite(message: PingMessage, writer: IBinaryWriter, options: BinaryWriteOptions): IBinaryWriter {
        /* uint32 count = 1; */
        if (message.count !== 0)
            writer.tag(1, WireType.Varint).uint32(message.count);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message IRacingTools.Models.RPC.Messages.PingMessage
 */
export const PingMessage = new PingMessage$Type();
// @generated message type with reflection information, may provide speed optimized methods
class PongMessage$Type extends MessageType<PongMessage> {
    constructor() {
        super("IRacingTools.Models.RPC.Messages.PongMessage", [
            { no: 1, name: "ping_count", kind: "scalar", T: 13 /*ScalarType.UINT32*/ }
        ]);
    }
    create(value?: PartialMessage<PongMessage>): PongMessage {
        const message = globalThis.Object.create((this.messagePrototype!));
        message.pingCount = 0;
        if (value !== undefined)
            reflectionMergePartial<PongMessage>(this, message, value);
        return message;
    }
    internalBinaryRead(reader: IBinaryReader, length: number, options: BinaryReadOptions, target?: PongMessage): PongMessage {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* uint32 ping_count */ 1:
                    message.pingCount = reader.uint32();
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
    internalBinaryWrite(message: PongMessage, writer: IBinaryWriter, options: BinaryWriteOptions): IBinaryWriter {
        /* uint32 ping_count = 1; */
        if (message.pingCount !== 0)
            writer.tag(1, WireType.Varint).uint32(message.pingCount);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message IRacingTools.Models.RPC.Messages.PongMessage
 */
export const PongMessage = new PongMessage$Type();
// @generated message type with reflection information, may provide speed optimized methods
class ListMessage$Type extends MessageType<ListMessage> {
    constructor() {
        super("IRacingTools.Models.RPC.Messages.ListMessage", [
            { no: 1, name: "subject", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 2, name: "query", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 10, name: "is_result", kind: "scalar", T: 8 /*ScalarType.BOOL*/ },
            { no: 11, name: "results_page", kind: "scalar", T: 5 /*ScalarType.INT32*/ },
            { no: 12, name: "results_per_page", kind: "scalar", T: 5 /*ScalarType.INT32*/ },
            { no: 13, name: "results_count", kind: "scalar", T: 13 /*ScalarType.UINT32*/ },
            { no: 20, name: "results", kind: "message", repeat: 1 /*RepeatType.PACKED*/, T: () => Any },
            { no: 60, name: "error_details", kind: "scalar", T: 9 /*ScalarType.STRING*/ }
        ]);
    }
    create(value?: PartialMessage<ListMessage>): ListMessage {
        const message = globalThis.Object.create((this.messagePrototype!));
        message.subject = "";
        message.query = "";
        message.isResult = false;
        message.resultsPage = 0;
        message.resultsPerPage = 0;
        message.resultsCount = 0;
        message.results = [];
        message.errorDetails = "";
        if (value !== undefined)
            reflectionMergePartial<ListMessage>(this, message, value);
        return message;
    }
    internalBinaryRead(reader: IBinaryReader, length: number, options: BinaryReadOptions, target?: ListMessage): ListMessage {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* string subject */ 1:
                    message.subject = reader.string();
                    break;
                case /* string query */ 2:
                    message.query = reader.string();
                    break;
                case /* bool is_result */ 10:
                    message.isResult = reader.bool();
                    break;
                case /* int32 results_page */ 11:
                    message.resultsPage = reader.int32();
                    break;
                case /* int32 results_per_page */ 12:
                    message.resultsPerPage = reader.int32();
                    break;
                case /* uint32 results_count */ 13:
                    message.resultsCount = reader.uint32();
                    break;
                case /* repeated google.protobuf.Any results */ 20:
                    message.results.push(Any.internalBinaryRead(reader, reader.uint32(), options));
                    break;
                case /* string error_details */ 60:
                    message.errorDetails = reader.string();
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
    internalBinaryWrite(message: ListMessage, writer: IBinaryWriter, options: BinaryWriteOptions): IBinaryWriter {
        /* string subject = 1; */
        if (message.subject !== "")
            writer.tag(1, WireType.LengthDelimited).string(message.subject);
        /* string query = 2; */
        if (message.query !== "")
            writer.tag(2, WireType.LengthDelimited).string(message.query);
        /* bool is_result = 10; */
        if (message.isResult !== false)
            writer.tag(10, WireType.Varint).bool(message.isResult);
        /* int32 results_page = 11; */
        if (message.resultsPage !== 0)
            writer.tag(11, WireType.Varint).int32(message.resultsPage);
        /* int32 results_per_page = 12; */
        if (message.resultsPerPage !== 0)
            writer.tag(12, WireType.Varint).int32(message.resultsPerPage);
        /* uint32 results_count = 13; */
        if (message.resultsCount !== 0)
            writer.tag(13, WireType.Varint).uint32(message.resultsCount);
        /* repeated google.protobuf.Any results = 20; */
        for (let i = 0; i < message.results.length; i++)
            Any.internalBinaryWrite(message.results[i], writer.tag(20, WireType.LengthDelimited).fork(), options).join();
        /* string error_details = 60; */
        if (message.errorDetails !== "")
            writer.tag(60, WireType.LengthDelimited).string(message.errorDetails);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message IRacingTools.Models.RPC.Messages.ListMessage
 */
export const ListMessage = new ListMessage$Type();
