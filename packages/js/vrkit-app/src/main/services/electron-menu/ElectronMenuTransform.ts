import { getLogger } from "@3fv/logger-proxy"
import { Menu, MenuItem } from "vrkit-shared"
import { Bind } from "vrkit-shared"
import Electron, { nativeImage } from "electron"
import { P, match } from "ts-pattern"
import { isFunction } from "@3fv/guard"
import { asOption } from "@3fv/prelude-ts"
import { flatten } from "lodash"
import { ElectronMenuClickInterceptor } from "./ElectronMenuRenderer"

const log = getLogger(__filename)
const { debug, trace, info, error, warn } = log


export class ElectronMenuTransform {
  
  readonly items: Array<MenuItem>
  
  get hasInterceptor() {
    return !!this.interceptor
  }
  
  constructor(
    items: Array<MenuItem[] | MenuItem>,
    readonly interceptor: ElectronMenuClickInterceptor = null
  ) {
    this.items = flatten(items)
  }
  
  /**
   * Transform the items to Electron.MenuItem
   *
   * @return {Electron.CrossProcessExports.MenuItem[]}
   */
  transform() {
    return this.items.map(this.convert)
  }
  
  
  @Bind
  private convert(item: MenuItem): Electron.MenuItem {
    const renderedItem = match(item)
      .with({ type: "checkbox" }, this.convertCheckbox)
      .with({ type: "submenu" }, this.convertSubmenu)
      .with(P, this.convertCommon)
      .run()
    
    const {interceptor} = this
    if (interceptor && isFunction(renderedItem.click)) {
      const click = renderedItem.click //.bind(menuItem)
      renderedItem.click = (event) => {
        interceptor(event, item.id, renderedItem.type === "checkbox" ? renderedItem.checked : null, item, renderedItem)
      }
    }
    
    return renderedItem
  }
  
  /**
   * Add a checkbox
   *
   * @param label
   * @param checked
   * @param execute
   * @param icon
   * @return {Electron.MenuItem}
   */
  @Bind
  convertCheckbox({
    label,
    checked,
    icon,
    click: execute
  }: MenuItem): Electron.MenuItem {
    if (isFunction(icon) && !execute) {
      execute = icon
      icon = null as undefined
    } else if (!!icon) {
      icon = icon as typeof nativeImage
    } else {
      throw Error(`No execute function provided to addCheckbox`)
    }
    
    return new Electron.MenuItem({
      label,
      checked,
      type: "checkbox",
      click: execute,
      ...(!!icon
        ? {
          icon: nativeImage.createFromDataURL(
            isFunction(icon) ? icon() : icon
          )
        }
        : {})
    })
  }
  
  /**
   * Add a submenu
   *
   * @returns {Electron.CrossProcessExports.MenuItem}
   * @param item
   */
  @Bind
  convertSubmenu(item: MenuItem): Electron.MenuItem {
    
    const submenu = asOption(item.submenu)
      .map(submenu => submenu instanceof Menu ? submenu : new Menu(submenu))
      .map(submenu => {
        const electronSubmenu = new Electron.Menu()
        submenu.getItems()
          .map(this.convert)
          .forEach(item => electronSubmenu.append(item))
        
        return electronSubmenu
      })
      .get()
    
    return new Electron.MenuItem({
      type: "submenu",
      label: item.label,
      submenu
    })
  }
  
  /**
   * Add a common item
   *
   * @param item
   * @returns {Electron.MenuItem}
   */
  @Bind
  convertCommon(item: MenuItem): Electron.MenuItem {
    const {
      role,
      type,
      click,
      label,
      accelerator,
      icon
    } = item
    return new Electron.MenuItem({
      type,
      role,
      click,
      label,
      accelerator,
      ...asOption(icon)
        .map(icon => ({
          icon: nativeImage.createFromDataURL(isFunction(icon) ? icon() : icon)
        }))
        .getOrElse({} as any)
    })
  }
}