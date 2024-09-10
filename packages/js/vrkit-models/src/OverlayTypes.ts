// @generated by protobuf-ts 2.9.4
// @generated from protobuf file "OverlayTypes.proto" (package "IRacingTools.Models.Dashboard", syntax proto3)
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
import { RectI } from "./Geometry";
/**
 * @generated from protobuf message IRacingTools.Models.Dashboard.OverlayInfo
 */
export interface OverlayInfo {
    /**
     * @generated from protobuf field: string id = 1;
     */
    id: string;
    /**
     * @generated from protobuf field: IRacingTools.Models.Dashboard.OverlayKind kind = 2;
     */
    kind: OverlayKind;
    /**
     * @generated from protobuf field: string name = 3;
     */
    name: string;
    /**
     * @generated from protobuf field: string description = 4;
     */
    description: string;
    /**
     * @generated from protobuf field: repeated string data_var_names = 20;
     */
    dataVarNames: string[];
}
/**
 * @generated from protobuf message IRacingTools.Models.Dashboard.OverlayPlacement
 */
export interface OverlayPlacement {
    /**
     * @generated from protobuf field: string id = 1;
     */
    id: string;
    /**
     * @generated from protobuf field: string overlay_id = 5;
     */
    overlayId: string;
    /**
     * @generated from protobuf field: IRacingTools.Models.RectI rect = 10;
     */
    rect?: RectI;
}
/**
 * @generated from protobuf enum IRacingTools.Models.Dashboard.OverlayKind
 */
export enum OverlayKind {
    /**
     * @generated from protobuf enum value: OVERLAY_KIND_TRACK_MAP = 0;
     */
    TRACK_MAP = 0,
    /**
     * @generated from protobuf enum value: OVERLAY_KIND_CLOCK = 1;
     */
    CLOCK = 1,
    /**
     * @generated from protobuf enum value: OVERLAY_KIND_CUSTOM = 10;
     */
    CUSTOM = 10
}
// @generated message type with reflection information, may provide speed optimized methods
class OverlayInfo$Type extends MessageType<OverlayInfo> {
    constructor() {
        super("IRacingTools.Models.Dashboard.OverlayInfo", [
            { no: 1, name: "id", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 2, name: "kind", kind: "enum", T: () => ["IRacingTools.Models.Dashboard.OverlayKind", OverlayKind, "OVERLAY_KIND_"] },
            { no: 3, name: "name", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 4, name: "description", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 20, name: "data_var_names", kind: "scalar", repeat: 2 /*RepeatType.UNPACKED*/, T: 9 /*ScalarType.STRING*/ }
        ]);
    }
    create(value?: PartialMessage<OverlayInfo>): OverlayInfo {
        const message = globalThis.Object.create((this.messagePrototype!));
        message.id = "";
        message.kind = 0;
        message.name = "";
        message.description = "";
        message.dataVarNames = [];
        if (value !== undefined)
            reflectionMergePartial<OverlayInfo>(this, message, value);
        return message;
    }
    internalBinaryRead(reader: IBinaryReader, length: number, options: BinaryReadOptions, target?: OverlayInfo): OverlayInfo {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* string id */ 1:
                    message.id = reader.string();
                    break;
                case /* IRacingTools.Models.Dashboard.OverlayKind kind */ 2:
                    message.kind = reader.int32();
                    break;
                case /* string name */ 3:
                    message.name = reader.string();
                    break;
                case /* string description */ 4:
                    message.description = reader.string();
                    break;
                case /* repeated string data_var_names */ 20:
                    message.dataVarNames.push(reader.string());
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
    internalBinaryWrite(message: OverlayInfo, writer: IBinaryWriter, options: BinaryWriteOptions): IBinaryWriter {
        /* string id = 1; */
        if (message.id !== "")
            writer.tag(1, WireType.LengthDelimited).string(message.id);
        /* IRacingTools.Models.Dashboard.OverlayKind kind = 2; */
        if (message.kind !== 0)
            writer.tag(2, WireType.Varint).int32(message.kind);
        /* string name = 3; */
        if (message.name !== "")
            writer.tag(3, WireType.LengthDelimited).string(message.name);
        /* string description = 4; */
        if (message.description !== "")
            writer.tag(4, WireType.LengthDelimited).string(message.description);
        /* repeated string data_var_names = 20; */
        for (let i = 0; i < message.dataVarNames.length; i++)
            writer.tag(20, WireType.LengthDelimited).string(message.dataVarNames[i]);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message IRacingTools.Models.Dashboard.OverlayInfo
 */
export const OverlayInfo = new OverlayInfo$Type();
// @generated message type with reflection information, may provide speed optimized methods
class OverlayPlacement$Type extends MessageType<OverlayPlacement> {
    constructor() {
        super("IRacingTools.Models.Dashboard.OverlayPlacement", [
            { no: 1, name: "id", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 5, name: "overlay_id", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 10, name: "rect", kind: "message", T: () => RectI }
        ]);
    }
    create(value?: PartialMessage<OverlayPlacement>): OverlayPlacement {
        const message = globalThis.Object.create((this.messagePrototype!));
        message.id = "";
        message.overlayId = "";
        if (value !== undefined)
            reflectionMergePartial<OverlayPlacement>(this, message, value);
        return message;
    }
    internalBinaryRead(reader: IBinaryReader, length: number, options: BinaryReadOptions, target?: OverlayPlacement): OverlayPlacement {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* string id */ 1:
                    message.id = reader.string();
                    break;
                case /* string overlay_id */ 5:
                    message.overlayId = reader.string();
                    break;
                case /* IRacingTools.Models.RectI rect */ 10:
                    message.rect = RectI.internalBinaryRead(reader, reader.uint32(), options, message.rect);
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
    internalBinaryWrite(message: OverlayPlacement, writer: IBinaryWriter, options: BinaryWriteOptions): IBinaryWriter {
        /* string id = 1; */
        if (message.id !== "")
            writer.tag(1, WireType.LengthDelimited).string(message.id);
        /* string overlay_id = 5; */
        if (message.overlayId !== "")
            writer.tag(5, WireType.LengthDelimited).string(message.overlayId);
        /* IRacingTools.Models.RectI rect = 10; */
        if (message.rect)
            RectI.internalBinaryWrite(message.rect, writer.tag(10, WireType.LengthDelimited).fork(), options).join();
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message IRacingTools.Models.Dashboard.OverlayPlacement
 */
export const OverlayPlacement = new OverlayPlacement$Type();
