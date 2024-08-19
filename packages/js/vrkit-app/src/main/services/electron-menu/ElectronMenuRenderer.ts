import type { MenuItem, MenuRenderer } from "vrkit-app-common/services"
import { asOption } from "@3fv/prelude-ts"
import * as Electron from "electron"
import { PostConstruct, Singleton } from "@3fv/ditsy"
import { getLogger } from "@3fv/logger-proxy"
import { Menu, MenuClickInterceptor } from "vrkit-app-common/services"
import { ElectronMenuTransform } from "./ElectronMenuTransform"

const log = getLogger(__filename)
const { debug, trace, info, error, warn } = log

export type ElectronMenuClickInterceptor = MenuClickInterceptor<Electron.Event,Electron.MenuItem>

@Singleton()
export class ElectronMenuRenderer implements MenuRenderer<Electron.Event, Electron.Menu, Electron.MenuItem> {
  
  @PostConstruct()
  protected async init() {
  
  }
  
  render(allItems: Array<MenuItem | MenuItem[]>, interceptor?: ElectronMenuClickInterceptor):Electron.Menu {
    const items = new ElectronMenuTransform(allItems, interceptor).transform()
    return Electron.Menu.buildFromTemplate(items)
  }
  
}
