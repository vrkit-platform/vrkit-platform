
let thisWindow: Window = null



function getWindow(): Window {
  return thisWindow
    ? thisWindow
    : typeof window !== "undefined"
    ? (thisWindow = window)
    : null
}

/**
 * Add window listener
 *
 * @param eventName
 * @param listener
 */
export function addWindowListener(eventName: string, listener: any): void {
  getWindow() && getWindow().addEventListener(eventName, listener)
}

/**
 * Remove window listener
 *
 * @param eventName
 * @param listener
 */
export function removeWindowListener(eventName: string, listener: any): void {
  getWindow() && getWindow().removeEventListener(eventName as any, listener)
}

