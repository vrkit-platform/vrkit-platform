import {
  BrowserWindow,
  type BrowserWindowConstructorOptions,
  type HandlerDetails,
  nativeImage,
  type WebPreferences,
  type WindowOpenHandlerResponse
} from "electron"
import iconPng from "!!url-loader!assets/images/logo/helmet-logo.png"
import { ElectronIPCChannelKind } from "@vrkit-platform/shared"
import { isFunction } from "@3fv/guard"

export const AppIconImage = nativeImage.createFromDataURL(iconPng)

export function windowOptionDefaults(webPreferences: Partial<WebPreferences> = {}): BrowserWindowConstructorOptions {
  return {
    fullscreenable: false,
    acceptFirstMouse: true,
    icon: AppIconImage,
    
    
    webPreferences: {
      backgroundThrottling: false,
      allowRunningInsecureContent: true,
      
      // webSecurity: true,
      nodeIntegration: true,
      nodeIntegrationInSubFrames: true,
      nodeIntegrationInWorker: true,
      contextIsolation: false,
      sandbox: false,
      experimentalFeatures: true,
      devTools: true, //isDev,
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
export function createWindowOpenHandler(
  fn?: (ev: HandlerDetails, result: WindowOpenHandlerResponse) => WindowOpenHandlerResponse
): WindowOpenHandler {
  return (ev: HandlerDetails): WindowOpenHandlerResponse => {
    let result: WindowOpenHandlerResponse = {
      action: "allow",
      overrideBrowserWindowOptions: {
        frame: false,
        transparent: true,
        backgroundColor: "#00000000",
        ...windowOptionDefaults()
      }
    }

    if (isFunction(fn)) result = fn(ev, result)

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
export function broadcastToAllWindows<Channel extends ElectronIPCChannelKind, Args extends unknown[]>(
  channel: Channel,
  ...args: Args
): number[] {
  return BrowserWindow.getAllWindows()
    .filter(win => !win.isDestroyed() && !win.webContents.isDestroyed() && !win.webContents.isCrashed())
    .map(win => {
      win.webContents.send(channel, ...args)
      return win.id
    })
}