import { isNotEmpty } from "vrkit-shared/utils"
import { ownerDocument } from "@mui/material"
import React, { HTMLAttributes, useMemo } from "react"
import { defaults } from "lodash"
import { getLogger } from "@3fv/logger-proxy"

const log = getLogger(__filename)
const { debug, trace, info, error, warn } = log

export namespace ListNavHelper {
  export type TraversalFunction = (
    list: HTMLElement,
    item: HTMLElement
  ) => HTMLElement

  export type HTMLElementHandler = (
    elem: HTMLElement,
    event: React.KeyboardEvent
  ) => any

  /**
   * Returns an element handler, which
   * get's a data attribute and passes it
   * to the provided setter when invoked
   *
   * @param {string} dataAttr
   * @param {(projectId: string, event: React.KeyboardEvent) => any} setter
   * @returns {ListNavHelper.HTMLElementHandler}
   */
  export function handleElementWithDataAttribute(
    dataAttr: string,
    setter: (itemId: string, event: React.KeyboardEvent) => any
  ): HTMLElementHandler {
    let previousValue: string = undefined
    return (elem: HTMLElement, event: React.KeyboardEvent) => {
      if (!elem.hasAttribute(dataAttr)) {
        debug(`No ${dataAttr} on elem`, elem)
        return
      }

      const value = elem.getAttribute(dataAttr)
      debug(`New value ${value} on elem`, elem)
      if (previousValue !== value && isNotEmpty(value)) {
        previousValue = value
        setter(value, event)
      }
    }
  }

  export function nextItem(list: HTMLElement, item: HTMLElement) {
    if (list === item) {
      return list.firstChild as HTMLElement
    }
    if (item && item.nextElementSibling) {
      return item.nextElementSibling as HTMLElement
    }
    return list.firstChild as HTMLElement
  }

  export function previousItem(list: HTMLElement, item: HTMLElement) {
    if (list === item) {
      return list.lastChild as HTMLElement
    }
    if (item && item.previousElementSibling) {
      return item.previousElementSibling as HTMLElement
    }
    return list.lastChild as HTMLElement
  }

  export function moveFocus(
    event: React.KeyboardEvent,
    list: HTMLElement,
    currentFocus: HTMLElement,
    traversalFunction: TraversalFunction,
    onMove: HTMLElementHandler,
    config: KeyDownConfig
  ) {
    let wrappedOnce = false
    let nextFocus = traversalFunction(list, currentFocus)

    while (nextFocus) {
      // Prevent infinite loop.
      if (nextFocus === list.firstChild) {
        if (wrappedOnce) {
          return
        }
        wrappedOnce = true
      }

      // Same logic as useAutocomplete.js
      const nextFocusDisabled =
        nextFocus["disabled"] ||
        nextFocus.getAttribute("aria-disabled") === "true"

      if (!nextFocus.hasAttribute("tabindex") || nextFocusDisabled) {
        // Move to the next element.
        nextFocus = traversalFunction(list, nextFocus)
      } else {
        if (!config.skipFocusItem) {
          nextFocus.focus()
        }
        if (onMove) {
          onMove(nextFocus, event)
        }
        return
      }
    }
  }

  export interface KeyDownConfig {
    selectionKeys: string[]
    previousItemKey: string
    nextItemKey: string
    startItemKey: string
    endItemKey: string

    /**
     * Defaults to listitem
     *
     * @see import("react").AriaRole
     */
    role: HTMLAttributes<HTMLLIElement>["role"]

    useDataItem: boolean

    /**
     * Skip calling `.focus()` on next/prev item
     */
    skipFocusItem: boolean
  }

  export type KeyDownOptions = Partial<KeyDownConfig>

  const keyDownConfigDefaults: KeyDownConfig = {
    selectionKeys: [],
    startItemKey: "Home",
    endItemKey: "End",
    previousItemKey: "ArrowUp",
    nextItemKey: "ArrowDown",
    role: "listitem",
    useDataItem: false,
    skipFocusItem: false
  }

  export function handleKeyDown(
    listRef: HTMLElement | React.RefObject<HTMLElement>,
    onMove?: HTMLElementHandler,
    options: KeyDownOptions = {}
  ) {
    const config = defaults(options, keyDownConfigDefaults) as KeyDownConfig,
      {
        selectionKeys,
        startItemKey,
        endItemKey,
        previousItemKey,
        nextItemKey,
        role: itemRole,
        useDataItem
      } = config
    return (event: React.KeyboardEvent) => {
      const list = listRef instanceof HTMLElement ? listRef : listRef.current
      let selectedItemElement: HTMLElement
      // Keyboard navigation assumes that [role="tab"] are siblings
      // though we might warn in the future about nested, interactive elements
      // as an a11y violation
      if (useDataItem) {
        selectedItemElement = list.querySelector("[data-item-selected]")
        debug("Selected item is", selectedItemElement)
        if (!selectedItemElement) {
          return
        }
      } else {
        const currentFocus = (selectedItemElement = ownerDocument(list)
          .activeElement as HTMLElement)
        const role = currentFocus.getAttribute("role")
        if (role !== itemRole) {
          return
        }
      }

      if (selectionKeys.includes(event.key)) {
        event.preventDefault()
        onMove(selectedItemElement, event)
        return
      }

      switch (event.key) {
        case previousItemKey:
          event.preventDefault()
          moveFocus(
            event,
            list,
            selectedItemElement,
            previousItem,
            onMove,
            config
          )
          break
        case nextItemKey:
          event.preventDefault()
          moveFocus(event, list, selectedItemElement, nextItem, onMove, config)
          break
        case startItemKey:
          event.preventDefault()
          moveFocus(event, list, null, nextItem, onMove, config)
          break
        case endItemKey:
          event.preventDefault()
          moveFocus(event, list, null, previousItem, onMove, config)
          break
        default:
          break
      }
    }
  }
  
  
  export function useListNavigation(
    dataAttr: string,
    setter: (itemId: string, event: React.KeyboardEvent) => any,
    listRef: HTMLElement | React.RefObject<HTMLElement>,
    options: KeyDownOptions = {},
    deps: any[] = []
  ) {
    const [onListMove, handleKeyDown] = useMemo(() => {
      const onListMove = ListNavHelper.handleElementWithDataAttribute(
        dataAttr,
        setter
      )
      
      const handleKeyDown = ListNavHelper.handleKeyDown(listRef, onListMove, options)
      
      return [onListMove, handleKeyDown]
    }, [...deps, setter, listRef, (listRef as React.RefObject<any>)?.current])
    
    return {onListMove, handleKeyDown}
  }
}

export const useListNavigation = ListNavHelper.useListNavigation

export default useListNavigation