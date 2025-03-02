import { app, BrowserWindow, dialog, Menu, MenuItemConstructorOptions } from "electron"
import { isMac } from "../../constants"
import { PostConstruct, Singleton } from "@3fv/ditsy"
import { getLogger } from "@3fv/logger-proxy"
import {
  ActionAccelerator,
  ActionMenuItemDesktopRoleKind,
  ActionRegistry,
  AppActionId,
  Bind,
  electronRoleToId,
  invokeWith,
  ThemeId
} from "@vrkit-platform/shared" // import MainAppState from "../store"
import { ElectronMainActionManager } from "../electron-actions"
import { capitalize, first } from "lodash"
import { assert } from "@3fv/guard"
import { inspectSharedWorker } from "../../utils/sharedWorkerHelpers"
import { ThemeType } from "@vrkit-platform/models"

const log = getLogger(__filename)
const { debug, trace, info, error, warn } = log

// type MenuItemRole = MenuItemConstructorOptions["role"]

const actionToItemFactory = (actionRegistry: ActionRegistry) => (id: string) => {
  const action = actionRegistry.get(id)
  assert(!!action, `Action not found for id (${id})`)
  return {
    label: action.name,
    click: (_, __, event) => {
      action.execute(action, event)
    },
    id,
    accelerator: ActionAccelerator.create(first(action.accelerators)).toElectron()
  } as MenuItemConstructorOptions
}

const roleItemFactory =
  (actionRegistry: ActionRegistry) =>
  (role: ActionMenuItemDesktopRoleKind, id: string = electronRoleToId(role)) => {
    const action = actionRegistry.get(id) ?? actionRegistry.find({ role })
    return {
      role,
      ...(action && {
        id: action.id,
        accelerator: ActionAccelerator.create(first(action.accelerators)).toElectron(),
        label: action.name,
        click: (_, __, event) => {
          action.execute(action, event)
        }
      })
    } as MenuItemConstructorOptions
  }

const devOptions = (actionRegistry: ActionRegistry) =>
  isDev
    ? invokeWith(roleItemFactory(actionRegistry), roleItem => [
        { type: "separator" },
        roleItem("reload"),
        {
          ...roleItem("forceReload"),
          accelerator: "CommandOrControl+F5",
        },
        {
          ...roleItem("toggleDevTools"),
          accelerator: "CommandOrControl+F10",
        },
        {
          label: "Inspect Shared Worker",
          accelerator: "CommandOrControl+F12",
          click: () => {
            if (!inspectSharedWorker()) {
              dialog.showErrorBox("Shared Worker Inspect Error", `Unable to find valid shared worker`)
            }
          }
        },
        {
          label: "Debugger",
          accelerator: "CommandOrControl+F11",
          click: () => {
            const windows = BrowserWindow.getAllWindows()
            const window = windows.find(win => win.isFocused())
            if (window) {
              window.webContents.executeJavaScript("debugger;")
            }
          }
        },
        { type: "separator" }
      ])
    : []

@Singleton()
export class ElectronMainMenuManager {
  @Bind
  private changeThemeMenuItem(themeId: ThemeId) {
    return {
      label: capitalize(themeId),
      click: () => {
        // this.mainAppState.setTheme(themeId)
      }
    } as MenuItemConstructorOptions
  }

  get template() {
    const { actionRegistry } = this,
      actionToItem = actionToItemFactory(actionRegistry),
      roleItem = roleItemFactory(actionRegistry)

    return Array<MenuItemConstructorOptions>(
      isMac && {
        label: app.name,
        submenu: [
          { role: "about" },
          { type: "separator" },
          actionToItem(AppActionId.gotoAppSettings),
          { type: "separator" },
          { role: "services" },
          { type: "separator" },
          // { role: "hide" as MenuItemRole },
          // { role: "hideOthers" as MenuItemRole },
          // { role: "unhide" as MenuItemRole },
          // { type: "separator" as MenuItemRole },
          actionToItem(AppActionId.quit)
        ] as MenuItemConstructorOptions["submenu"]
      }, // { role: 'fileMenu' }
      {
        label: "File",
        submenu: [
          // actionToItem(AppActionIds.newWindow),
          !isMac && actionToItem(AppActionId.closeWindow),
          !isMac && actionToItem(AppActionId.quit)
        ].filter(Boolean)
      }, // { role: 'editMenu' }
      {
        label: "Edit",
        submenu: [
          roleItem("undo"),
          roleItem("redo"),
          { type: "separator" },
          roleItem("cut"),
          roleItem("copy"),
          roleItem("paste"),
          roleItem("selectAll")
        ] as MenuItemConstructorOptions[]
      },
      {
        label: "View",
        submenu: [
          {
            label: "Theme",
            submenu: [...Object.keys(ThemeType).map(this.changeThemeMenuItem)]
          },

          actionToItem(AppActionId.zoomDefault),
          actionToItem(AppActionId.zoomIn),
          actionToItem(AppActionId.zoomOut),
          { type: "separator" },
          roleItem("togglefullscreen"),

          // DEV MENU ITEMS
          ...devOptions(actionRegistry)
        ] as MenuItemConstructorOptions[]
      },
      {
        label: "Window",
        submenu: [
          roleItem("minimize"),
          ...(isMac
            ? [
                { type: "separator" },
                roleItem("front"),
                { type: "separator" },
                roleItem("close", AppActionId.closeWindow)
              ]
            : [])
        ] as MenuItemConstructorOptions[]
      },
      {
        role: "help",
        submenu: [
          // {
          //   label: "Knowledge Base",
          //   click: async () => {
          //     await shell.openExternal("https://taskx.com")
          //   }
          // }
        ]
      }
    ).filter(Boolean)
  }

  @PostConstruct()
  async updateApplicationMenu() {
    // this.actions.add()
    const defaultMenu = Menu.getApplicationMenu()
    const menu = Menu.buildFromTemplate(this.template)
    Menu.setApplicationMenu(menu)
    // if (isDev) {
    //   const current = Menu.getApplicationMenu()
    //   info(`App menu`, inspect(current))
    // }

    if (import.meta.webpackHot) {
      import.meta.webpackHot.addDisposeHandler(() => {
        Menu.setApplicationMenu(defaultMenu)
      })
    }
  }

  constructor(
    readonly actionRegistry: ActionRegistry,
    readonly electronActions: ElectronMainActionManager
    // readonly mainAppState: MainAppState
  ) {}
}
