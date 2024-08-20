import * as React from "react"

import { isFunction, isString } from "@3fv/guard"
import { isValidElement, ReactNode } from "react"


export const InputTagNames = ['INPUT','SELECT','TEXTAREA']

export function isReactNode(o:any):o is ReactNode {
  return isValidElement(o)
}

export function isReactComponent(c:any):c is React.Component<any,any> {
  return c && (
    c instanceof React.Component ||
    (c.prototype && c.prototype.isPrototypeOf(React.Component))
  )
}

export function isHTMLElement(e:any): e is HTMLElement {
  return e instanceof HTMLElement
}

export function getZIndex(element): number {
  try {
    let z = window.document.defaultView
      .getComputedStyle(element)
      .getPropertyValue("z-index") as any

    if (isString(z)) {
      z = parseInt(z, 10)
    }

    if (isNaN(z)) {
      return getZIndex(element.parentNode)
    }

    return z
  } catch (err) {
    //log.error("Unable to find z index",err)
    return 0
  }
}

export function isInputElement(element: HTMLElement) {
  return InputTagNames.includes(element?.tagName)
}

export function interceptEvent<E extends React.SyntheticEvent = React.SyntheticEvent>(...handlers: ((e: E) => any)[]) {
  handlers = handlers.filter(isFunction)
  return (e: E) => {
    while (handlers.length) {
      const handler = handlers.shift()
      handler(e)
      if (e.isDefaultPrevented()) {
        return false
      }
    }
  }
}