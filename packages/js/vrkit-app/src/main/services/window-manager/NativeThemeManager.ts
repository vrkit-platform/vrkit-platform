import { PostConstruct, Singleton } from '@3fv/ditsy'
import { getLogger } from "@3fv/logger-proxy"
import { Bind } from "@vrkit-platform/shared"
import { ipcMain, IpcMainEvent, nativeTheme, webContents } from "electron"
import { getAppThemeFromSystem } from "../../utils/getAppThemeFromSystem"
// import MainStateStore from "../store"
import { ElectronIPCChannel } from "@vrkit-platform/shared"

const log = getLogger(__filename)
const { debug, trace, info, error, warn } = log

@Singleton()
export class NativeThemeManager {
  
  @Bind
  private getNativeThemeSync(event: IpcMainEvent) {
    event.returnValue = getAppThemeFromSystem()
  }
  
  @Bind
  @PostConstruct()
  private onUpdated() {
    const newTheme = getAppThemeFromSystem()
    // this.store.setSystemTheme(newTheme)
    webContents.getAllWebContents()
      .forEach(content =>
        content.send(ElectronIPCChannel.nativeThemeChanged, newTheme))
  }

  
  
  constructor(
    // readonly store: MainStateStore
  ) {
    nativeTheme.on("updated", this.onUpdated)
    ipcMain.on(ElectronIPCChannel.getNativeThemeSync,this.getNativeThemeSync)
    
    if (import.meta.webpackHot) {
      import.meta.webpackHot.addDisposeHandler(() => {
        ipcMain.off(ElectronIPCChannel.getNativeThemeSync,this.getNativeThemeSync)
      })
    }
  }
}
