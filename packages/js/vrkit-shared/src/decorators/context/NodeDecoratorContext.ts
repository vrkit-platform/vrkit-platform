import type * as SerializersType from "serializr"
import type { JSONSchema as JSONSchemaType } from "class-validator-jsonschema"

import { memoize } from "lodash"
import type {
  AnyDecorator,
  AnyDecorators
} from "../AnyDecorator"
import type { GenericDecoratorContext } from "./GenericDecoratorContext"

import { isString } from "@3fv/guard"
import { isNotEmpty } from "../../utils"


declare global {
  let TARGET_PLATFORM: string
}

const possibleTargetPlatforms = [typeof TARGET_PLATFORM === "string" && TARGET_PLATFORM, typeof process !== "undefined" && process.env.TARGET_PLATFORM, typeof process !== "undefined" && isString(process.version) && "node"].filter(isNotEmpty)

const targetPlatform = possibleTargetPlatforms[0]

export interface NodeDecoratorContext
  extends GenericDecoratorContext {
  JSONSchema: typeof JSONSchemaType
}

export const getNodeDecoratorContext = memoize(
  (): NodeDecoratorContext => {
    if (
      process.env.TARGET_PLATFORM === "node" &&
      targetPlatform !== "web" &&
      targetPlatform !== "electron-renderer"
    ) {
      const
        JSONSchema = require("class-validator-jsonschema")
          .JSONSchema as typeof JSONSchemaType

      const Serializers =
        require("serializr") as typeof SerializersType
      
      return {
        Serializers,
        JSONSchema,
      }
    } else {
      return null
    }
  }
)

export type NodeContextDecorator = (
  ctx: NodeDecoratorContext
) => AnyDecorators | AnyDecorator
