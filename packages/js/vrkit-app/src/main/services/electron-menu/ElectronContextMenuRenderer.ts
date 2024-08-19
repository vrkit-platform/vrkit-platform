import Electron, { ipcMain } from "electron"
import {
  ElectronMenuClickInterceptor,
  ElectronMenuRenderer
} from "./ElectronMenuRenderer"
import { asOption } from "@3fv/prelude-ts"
import { getLogger } from "@3fv/logger-proxy"
import { PostConstruct, Singleton } from "@3fv/ditsy"
import { ActionRegistry, ElectronIPCChannel, MenuItem } from "vrkit-app-common/services"
import { Bind } from "vrkit-app-common/decorators"
import { Deferred } from "@3fv/deferred"
import { Pair, pairOf } from "vrkit-app-common/utils"
import { noop } from "lodash"

const log = getLogger(__filename)
const { debug, trace, info, error, warn } = log

type ContextMenuResultDeferred = Deferred<Pair<string, any>>

/**
 * Interceptor that captures the action id that was clicked
 */
function electronContextMenuClickInterceptor(
  sender: Electron.WebContents
): Pair<ContextMenuResultDeferred, ElectronMenuClickInterceptor> {
  const resultDeferred = new Deferred<Pair<string, any>>()

  return [
    resultDeferred,
    (
      event: Electron.Event,
      id: string,
      value: any,
      item: MenuItem,
      renderedItem: Electron.MenuItem
    ) => {
      if (resultDeferred.isSettled()) {
        warn(`Already used interceptor, only works once`)
        return
      }
      resultDeferred.resolve(pairOf(id, value))
    }
  ]
}

/**
 * Render context menu when requested (Over IPC usually)
 */
@Singleton()
export class ElectronContextMenuRenderer extends ElectronMenuRenderer {

  /**
   * On IPC request for context menu, build it and show it
   *
   * @param {Electron.CrossProcessExports.IpcMainEvent} event
   * @param {MenuItem[]} items
   * @private
   */
  @Bind
  private async onContextMenuShow(
    event: Electron.IpcMainEvent | Electron.IpcMainInvokeEvent,
    items: MenuItem[]
  ): Promise<Pair<string, any> | void> {
    const [menuResultDeferred, interceptor] =
        electronContextMenuClickInterceptor(event.sender),
      menu = this.render(items, interceptor),
      menuCloseCallback = () => {
        if (menuResultDeferred.isSettled()) {
          warn(`already settled`)
          return
        }

        info(`Close callback invoked`)
        menuResultDeferred.resolve([null,null])
      },
      window = Electron.BrowserWindow.fromWebContents(event.sender)

    // SHOW THE MENU
    menu.popup({
      window,
      callback: menuCloseCallback
    })

    // WAIT FOR RESULT
    debug(`Waiting for menu result`)
    const [id, value] = await menuResultDeferred.promise

    info(`ContextMenu result (%O)`, { id, value })

    // INVOKE ACTION IF AVAILABLE IN MAIN
    const action = this.actionRegistry.get(id)
    if (!!action) {
      debug(`Invoking action (${id})`, action.name)
      await Promise.resolve(action.execute())
    } else {
      debug(`Action not found on Electron main (${id})`)
    }

    // RETURN FINAL RESULT
    return pairOf(id, value)
  }

  @PostConstruct()
  protected async init() {
    ipcMain.handle(ElectronIPCChannel.showContextMenu, this.onContextMenuShow)
    if (module.hot) {
      module.hot.addDisposeHandler(() => {
        ipcMain.removeHandler(ElectronIPCChannel.showContextMenu)
      })
    }
  }

  constructor(readonly actionRegistry: ActionRegistry) {
    super()
  }

}
