import { PostConstruct, Singleton } from '@3fv/ditsy'
import { getLogger } from "@3fv/logger-proxy"
import { Bind } from "vrkit-app-common/decorators"
import { ipcMain, IpcMainEvent, nativeTheme, webContents } from "electron"
import { getAppThemeFromSystem } from "../../utils/getAppThemeFromSystem"
// import MainStateStore from "../store"
import { ElectronIPCChannel } from "vrkit-app-common/services/electron"

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
    
    if (module.hot) {
      module.hot.addDisposeHandler(() => {
        ipcMain.off(ElectronIPCChannel.getNativeThemeSync,this.getNativeThemeSync)
      })
    }
  }
}
