import type Electron from "electron"
import { ErrorKind, Pair, pairOf } from "@vrkit-platform/shared"
import { useEffect, useRef, useState } from "react"

import { getLogger } from "@3fv/logger-proxy"
import { asOption } from "@3fv/prelude-ts"
import { Menu } from "@vrkit-platform/shared"

const log = getLogger(__filename)
const { debug, trace, info, error, warn } = log

export function useElectronContextMenu(
  menu: Menu,
  open: boolean,
  onClose: () => any
) {
  const contextMenuRef = useRef<{
    onClose: () => any
    promise: Promise<Pair<string, any>>
  }>(null)

  useEffect(() => {
    // const { current } = contextMenuRef
    // if (!open && isFunction(current?.onClose)) {
    //   current?.onClose?.()
    // }
    //
    // contextMenuRef.current = null
    //
    // if (open) {
    //   contextMenuRef.current = {
    //     promise: showElectronContextMenu(menu.getItems())
    //       .catch(err => {
    //         error(`context menu error`, err)
    //         return pairOf(err, null)
    //       })
    //       .finally(() => {
    //         onClose?.()
    //       }),
    //     onClose
    //   }
    // }
    return () => {}
  }, [menu, open, onClose])
}

export type ElectronContextMenuResult = [
  id?: string,
  value?: string,
  err?: ErrorKind
]
export interface ElectronContextMenuState {
  handleResult: () => any
  promise: Promise<ElectronContextMenuResult>
}
export function useElectronContextMenuHelper(
  menu: Menu,
  handleResult?: (...args: ElectronContextMenuResult) => any
) {
  // const openRef = useRef(false)
  // const contextMenuRef = useRef<ElectronContextMenuState>(null)
  //
  // const popup = (): Promise<ElectronContextMenuResult> => {
  //   const ctx = contextMenuRef.current
  //   const open = openRef.current
  //   if (open || ctx?.promise) {
  //     return ctx.promise
  //   }
  //
  //   openRef.current = true
  //
  //   const promise = showElectronContextMenu(menu.getItems())
  //     .catch(err => {
  //       error(`context menu error`, err)
  //       return [null, null, err]
  //     })
  //     .then((res: ElectronContextMenuResult = []) => {
  //       info(`Context menu result`, res)
  //       if (isFunction(handleResult)) {
  //         handleResult?.(...res)
  //       } else if (isString(res[0])) {
  //         const id = res[0],
  //           item = menu.findItemById(id)
  //
  //         assert(!!item, `Unable to find item with id (${id})`)
  //         if (!isFunction(item.click)) {
  //           warn(`item with id (${id}) has no click function`, item)
  //         } else {
  //           item.click()
  //         }
  //       } else {
  //         warn(`No id returned as result from context menu`)
  //       }
  //       return res as ElectronContextMenuResult
  //     })
  //     .finally(() => {
  //       openRef.current = false
  //       contextMenuRef.current = null
  //     })
  //
  //   contextMenuRef.current = {
  //     promise,
  //     handleResult
  //   }
  //
  //   return promise
  // }
  //
  // return { popup, isOpen: () => openRef.current }
}
