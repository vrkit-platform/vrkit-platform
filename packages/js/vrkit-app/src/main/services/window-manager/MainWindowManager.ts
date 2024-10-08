import { PostConstruct, Singleton } from "@3fv/ditsy"
import WindowManager from "./WindowManagerService"
import { BrowserWindow } from "electron"
import EventEmitter3 from "eventemitter3"

export interface MainWindowEventArgs {
  UI_READY: (win: BrowserWindow) => void
}

@Singleton()
export class MainWindowManager extends EventEmitter3<MainWindowEventArgs> {
  private mainWindow_:Electron.BrowserWindow = null
  
  get mainWindow() {
    return this.mainWindow_
  }
  
  constructor(readonly windowManager:WindowManager) {
    super()
  }
  
  @PostConstruct() // @ts-ignore
  private async init():Promise<void> {
    if (import.meta.webpackHot) {
      const previousMainWindow = import.meta.webpackHot.data?.["mainWindow"]
      if (previousMainWindow) {
        this.setMainWindow(previousMainWindow)
      }
      
      import.meta.webpackHot.dispose(data => {
        data["mainWindow"] = this.mainWindow_
      })
    }
  }
  
  setMainWindow(newMainWindow:Electron.BrowserWindow = null) {
    this.mainWindow_ = newMainWindow
    this.windowManager.enable(newMainWindow)
  }
}