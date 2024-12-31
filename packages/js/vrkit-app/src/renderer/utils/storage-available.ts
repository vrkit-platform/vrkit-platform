import { getValue } from "@3fv/guard"

export function localStorageAvailable() {
  try {
    const key = "__vrkit-platform-storage-check__"
    localStorage.setItem(key, key)
    localStorage.removeItem(key)
    return true
  } catch (error) {
    return false
  }
}

export function localStorageGetItem(key: string, defaultValue:string = "") {
  return getValue(() => localStorage.getItem(key), defaultValue)
}
