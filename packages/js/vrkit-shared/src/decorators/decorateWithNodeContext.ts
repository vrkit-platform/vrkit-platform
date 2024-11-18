import type { GenericDecorator } from "./context/GenericDecorator"
import {
  getNodeDecoratorContext,
  NodeContextDecorator
} from "./context/NodeDecoratorContext"
import type { GenericContextDecorator } from "./context/GenericContextDecorator"
import type { AnyDecorators } from "./AnyDecorator"
import { isFunction, isString } from "@3fv/guard"
import { applyDecorators } from "./applyDecorators"
import { getGenericDecoratorContext } from "./context/GenericDecoratorContext"
import { flatten, identity } from "lodash"
import { isNotEmpty } from "../utils"


const possibleTargetPlatforms = [typeof TARGET_PLATFORM === "string" && TARGET_PLATFORM, typeof process !== "undefined" && process.env.TARGET_PLATFORM, typeof process !== "undefined" && isString(process.version) && "node"].filter(isNotEmpty)

const targetPlatform = possibleTargetPlatforms[0]


export function decorateWithNodeContext(
  nodeFn: NodeContextDecorator,
  genericFn?: GenericContextDecorator
): GenericDecorator {
  let decorators: AnyDecorators = []

  // Create Node.JS Decorators when Env !== Browser, etc
  // console.info(`Target platform`, possibleTargetPlatforms, targetPlatform)
  if (
    process.env.TARGET_PLATFORM !== "web" &&
    targetPlatform !== "web" &&
    process.env.TARGET_PLATFORM !== "electron-renderer" &&
    targetPlatform !== "electron-renderer" &&
    isFunction(nodeFn)
  ) {
    decorators.push(
      ...flatten([nodeFn(getNodeDecoratorContext())])
    )
  }

  if (isFunction(genericFn)) {
    decorators.push(
      ...flatten([genericFn(getGenericDecoratorContext())])
    )
  }

  return !decorators.length
    ? () => {}
    : applyDecorators(...decorators)
}

/**
 * A decorator that is only processed in a Node env
 *
 * @param nodeFn
 * @param genericFn
 * @constructor
 */
export function NodeDecorator(
  nodeFn: NodeContextDecorator,
  genericFn?: GenericContextDecorator
) {
  return decorateWithNodeContext(nodeFn, genericFn)
}
