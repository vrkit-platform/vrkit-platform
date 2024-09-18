import {
  BrowserWindow,
  type BrowserWindowConstructorOptions,
  type HandlerDetails,
  type WebPreferences,
  type WindowOpenHandlerResponse
} from "electron"
import iconPng from "!!url-loader!assets/icons/icon.png"
import { isDev } from "vrkit-app-common/utils"
import { isFunction } from "@3fv/guard"
import { ElectronIPCChannelKind } from "vrkit-app-common/services"

export function windowOptionDefaults(webPreferences: Partial<WebPreferences> = {}): BrowserWindowConstructorOptions {
  return {
    fullscreenable: false,
    icon: iconPng,
    //resizable: true,
    webPreferences: {
      allowRunningInsecureContent: true,
      webSecurity: false,
      nodeIntegration: true,
      nodeIntegrationInSubFrames: true,
      nodeIntegrationInWorker: true,
      contextIsolation: false,
      sandbox: false,
      devTools: isDev,
      ...webPreferences
    }
  }
}

export type WindowOpenHandler = (ev: HandlerDetails) => WindowOpenHandlerResponse

/**
 * Create a new handler for window open requests in renderer
 *
 * @param fn
 */
export function createWindowOpenHandler(fn?: (ev: HandlerDetails, result: WindowOpenHandlerResponse) => WindowOpenHandlerResponse): WindowOpenHandler  {
  return (ev: HandlerDetails): WindowOpenHandlerResponse => {
    
    let result:WindowOpenHandlerResponse = {
      action: "allow",
      overrideBrowserWindowOptions: {
        frame: false,
        transparent: true,
        backgroundColor: "#00000000",
        ...windowOptionDefaults()
      }
    }
    
    if (isFunction(fn))
      result = fn(ev, result)
    
    return result
  }
}


/**
 * Broadcast a message to all renderers
 *
 * @param channel ipc channel
 * @param args for the event
 * @returns {number[]} window ids that the message was sent to
 */
export function broadcastToAllWindows<Channel extends ElectronIPCChannelKind, Args extends unknown[]>(channel: Channel, ...args:Args): number[] {
  return BrowserWindow.getAllWindows().map(win => {
    win.webContents.send(channel, ...args)
    return win.id
  })
}