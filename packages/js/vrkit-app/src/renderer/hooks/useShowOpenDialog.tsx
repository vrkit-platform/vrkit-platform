import { getLogger } from "@3fv/logger-proxy"
import { Deferred } from "@3fv/deferred"
import type {OpenDialogOptions, OpenDialogReturnValue} from "electron"
import {dialog} from "@electron/remote"

import { guard, isPromise } from "@3fv/guard"

const log = getLogger(__filename)

let pendingDeferred:Deferred<void> = null

export function useShowOpenDialog(fn: (res: OpenDialogReturnValue) => Promise<void> | void, options: OpenDialogOptions = {  }): () => void {
  return () => {
    if (pendingDeferred && !pendingDeferred.isSettled()) {
      log.warn("Pending show open dialog is not completed yet, ignoring call")
      return
    }
    
    pendingDeferred = new Deferred()
  
    dialog.showOpenDialog({
      properties: ['openFile'],
      ...options
    }).then(async res => {
      log.info("Selected file to open as session", res)
      const fnRes = fn(res)
      if (isPromise(fnRes)) {
        try {
          return await fnRes
        } finally {
          pendingDeferred.resolve()
        }
      } else {
        pendingDeferred.resolve()
        return pendingDeferred.promise
      }
    }).catch(err => {
      log.error("Unable to open disk session", err)
      pendingDeferred.reject(err)
    }).finally(() => {
      pendingDeferred = null
    })
   
  }
}