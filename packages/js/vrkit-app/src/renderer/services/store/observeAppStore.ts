import type { AppStore, AppSelector } from "./AppStore"
import type { Unsubscribe } from "@reduxjs/toolkit"

export function observeAppStore<T>(
  selector: AppSelector<T>,
  onChange: (value: T) => any,
  skipImmediateInvoke: boolean = false,
  appStore: AppStore = null
): Unsubscribe {
  if (!appStore) {
    appStore = require("./AppStore").appStore as AppStore
  }
  
  let currentState: T | null = null

  function handleChange() {
    let nextState = selector(appStore.getState())
    if (nextState !== currentState) {
      currentState = nextState
      onChange(currentState)
    }
  }

  const unsubscribe = appStore.subscribe(handleChange)

  if (!skipImmediateInvoke) {
    handleChange()
  }

  return unsubscribe
}
