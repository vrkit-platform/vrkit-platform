import { ElectronIPCChannelKind } from "@vrkit-platform/shared"
import { BrowserWindow } from "electron"

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