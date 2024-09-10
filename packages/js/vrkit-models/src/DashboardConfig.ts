// @generated by protobuf-ts 2.9.4
// @generated from protobuf file "DashboardConfig.proto" (package "IRacingTools.Models.Dashboard", syntax proto3)
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
import { OverlayPlacement } from "./OverlayTypes";
import { OverlayInfo } from "./OverlayTypes";
import { ScreenConfig } from "./ScreenConfig";
/**
 * @generated from protobuf message IRacingTools.Models.Dashboard.DashboardConfig
 */
export interface DashboardConfig {
    /**
     * @generated from protobuf field: string id = 1;
     */
    id: string;
    /**
     * @generated from protobuf field: string name = 2;
     */
    name: string;
    /**
     * @generated from protobuf field: string description = 3;
     */
    description: string;
    /**
     * @generated from protobuf field: string screen_id = 10;
     */
    screenId: string;
    /**
     * @generated from protobuf field: IRacingTools.Models.ScreenConfig screen = 12;
     */
    screen?: ScreenConfig;
    /**
     * @generated from protobuf field: repeated IRacingTools.Models.Dashboard.OverlayInfo overlays = 20;
     */
    overlays: OverlayInfo[];
    /**
     * @generated from protobuf field: repeated IRacingTools.Models.Dashboard.OverlayPlacement placements = 25;
     */
    placements: OverlayPlacement[];
}
// @generated message type with reflection information, may provide speed optimized methods
class DashboardConfig$Type extends MessageType<DashboardConfig> {
    constructor() {
        super("IRacingTools.Models.Dashboard.DashboardConfig", [
            { no: 1, name: "id", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 2, name: "name", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 3, name: "description", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 10, name: "screen_id", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 12, name: "screen", kind: "message", T: () => ScreenConfig },
            { no: 20, name: "overlays", kind: "message", repeat: 1 /*RepeatType.PACKED*/, T: () => OverlayInfo },
            { no: 25, name: "placements", kind: "message", repeat: 1 /*RepeatType.PACKED*/, T: () => OverlayPlacement }
        ]);
    }
    create(value?: PartialMessage<DashboardConfig>): DashboardConfig {
        const message = globalThis.Object.create((this.messagePrototype!));
        message.id = "";
        message.name = "";
        message.description = "";
        message.screenId = "";
        message.overlays = [];
        message.placements = [];
        if (value !== undefined)
            reflectionMergePartial<DashboardConfig>(this, message, value);
        return message;
    }
    internalBinaryRead(reader: IBinaryReader, length: number, options: BinaryReadOptions, target?: DashboardConfig): DashboardConfig {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* string id */ 1:
                    message.id = reader.string();
                    break;
                case /* string name */ 2:
                    message.name = reader.string();
                    break;
                case /* string description */ 3:
                    message.description = reader.string();
                    break;
                case /* string screen_id */ 10:
                    message.screenId = reader.string();
                    break;
                case /* IRacingTools.Models.ScreenConfig screen */ 12:
                    message.screen = ScreenConfig.internalBinaryRead(reader, reader.uint32(), options, message.screen);
                    break;
                case /* repeated IRacingTools.Models.Dashboard.OverlayInfo overlays */ 20:
                    message.overlays.push(OverlayInfo.internalBinaryRead(reader, reader.uint32(), options));
                    break;
                case /* repeated IRacingTools.Models.Dashboard.OverlayPlacement placements */ 25:
                    message.placements.push(OverlayPlacement.internalBinaryRead(reader, reader.uint32(), options));
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
    internalBinaryWrite(message: DashboardConfig, writer: IBinaryWriter, options: BinaryWriteOptions): IBinaryWriter {
        /* string id = 1; */
        if (message.id !== "")
            writer.tag(1, WireType.LengthDelimited).string(message.id);
        /* string name = 2; */
        if (message.name !== "")
            writer.tag(2, WireType.LengthDelimited).string(message.name);
        /* string description = 3; */
        if (message.description !== "")
            writer.tag(3, WireType.LengthDelimited).string(message.description);
        /* string screen_id = 10; */
        if (message.screenId !== "")
            writer.tag(10, WireType.LengthDelimited).string(message.screenId);
        /* IRacingTools.Models.ScreenConfig screen = 12; */
        if (message.screen)
            ScreenConfig.internalBinaryWrite(message.screen, writer.tag(12, WireType.LengthDelimited).fork(), options).join();
        /* repeated IRacingTools.Models.Dashboard.OverlayInfo overlays = 20; */
        for (let i = 0; i < message.overlays.length; i++)
            OverlayInfo.internalBinaryWrite(message.overlays[i], writer.tag(20, WireType.LengthDelimited).fork(), options).join();
        /* repeated IRacingTools.Models.Dashboard.OverlayPlacement placements = 25; */
        for (let i = 0; i < message.placements.length; i++)
            OverlayPlacement.internalBinaryWrite(message.placements[i], writer.tag(25, WireType.LengthDelimited).fork(), options).join();
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message IRacingTools.Models.Dashboard.DashboardConfig
 */
export const DashboardConfig = new DashboardConfig$Type();
