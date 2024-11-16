import type { Renderable } from "react-hot-toast"
import React from "react"
import { isFunction, isString } from "@3fv/guard"

export function isAlertRenderable(errorOrMessage:any):errorOrMessage is Renderable {
  return React.isValidElement(errorOrMessage) ||
    isString(errorOrMessage) ||
    isFunction(errorOrMessage)
}
