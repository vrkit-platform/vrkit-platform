//import "webpack-env"
import { getLogger } from "@3fv/logger-proxy"

import { Container, Inject, InjectContainer, PostConstruct, Singleton } from "@3fv/ditsy"
import {
  assert,
  Bind, greaterThan,
  importDefault,
  isNotEmpty,
  OverlayManagerClientEventHandler
} from "vrkit-shared"

import { APP_STORE_ID, isDev } from "../../renderer-constants"
import {
  IPluginClient,
  IPluginClientEventArgs,
  IPluginComponentFactory,
  IPluginComponentProps,
  TPluginComponentType
} from "vrkit-plugin-sdk"
import { OverlayConfig, OverlayKind, PluginComponentDefinition, PluginInstall } from "vrkit-models"
import OverlayManagerClient from "./OverlayManagerClient"
import { asOption } from "@3fv/prelude-ts"
import TrackManager from "../track-manager"
import React from "react"
import { sharedAppSelectors } from "../store/slices/shared-app"
import { AppStore } from "../store"
import { isArray, isFunction, isPromise, isString } from "@3fv/guard"
import Module, { isBuiltin } from "module"
import VM, { Context } from "vm"
import Fsx from "fs-extra"
import Path from "path"
import JSON5 from "json5"
import { PackageJson } from "type-fest"
import { Deferred } from "@3fv/deferred"
import { overlayWindowActions } from "../store/slices/overlay-window"

// noinspection TypeScriptUnresolvedVariable
const log = getLogger(__filename)

// noinspection JSUnusedLocalSymbols
const { debug, trace, info, error, warn } = log


export interface IPluginRequireFunction extends NodeJS.Require {}

const PluginExternalModuleNames = [
  "@3fv/guard",
  "@3fv/deferred",
  "@3fv/logger-proxy",
  "@3fv/prelude-ts",
  "@3fv/ditsy",
  "@mui/material/styles",
  "@mui/styled-engine",
  "@mui/system",
  "@mui/material",
  "@mui/lab",
  "@mui/x-data-grid",
  "@mui/x-date-pickers",
  "@mui/x-tree-view",
  "lodash",
  "lodash.debounce",
  "usehooks-ts",
  "vrkit-plugin-sdk",
  "vrkit-models",
  "vrkit-shared",
  "vrkit-shared-ui",
  "electron",
  "react",
  "react-dom"
]

let pluginExternalRequire: IPluginRequireFunction = null

async function GetPluginExternalRequire() {
  const deferred = new Deferred<IPluginRequireFunction>()
  require([
    "@3fv/guard",
    "@3fv/deferred",
    "@3fv/logger-proxy",
    "@3fv/prelude-ts",
    "@3fv/ditsy",
    "@mui/material/styles",
    "@mui/styled-engine",
    "@mui/system",
    "@mui/material",
    "@mui/lab",
    "@mui/x-data-grid",
    "@mui/x-date-pickers",
    "@mui/x-tree-view",
    "lodash",
    "lodash.debounce",
    "usehooks-ts",
    "vrkit-plugin-sdk",
    "vrkit-models",
    "vrkit-shared",
    "vrkit-shared-ui",
    "electron",
    "react",
    "react-dom"
  ], (...mods: any[]) => {
    deferred.resolve(((id: string) => {
      
      return asOption(PluginExternalModuleNames.indexOf(id))
          .filter(greaterThan(-1))
          .map(idx => mods[idx])
          .getOrThrow(`Unable to find ${id}`)
    }) as any)
  })
  //     , err => {
  //   log.error(`unable to setup external plugin require`, err)
  // })
  
  pluginExternalRequire = await deferred.promise
  return pluginExternalRequire
}

// async function
// require.ensure()
    // PluginExternalModuleCache = PluginExternalModuleNames.reduce((map, modName) => ({
    //   ...map,
    //   [modName](modName)
    // }), {} as any)

export class PluginLoader {
  private readonly state_: {
    moduleIdCache: Record<string, any>
    componentFactory?: IPluginComponentFactory
    vm: {
      context?: Context
      contextObj: {
        
        module: {
          exports: any
        }
      } & any
      script?: VM.Script
    }
    global: {
      require: IPluginRequireFunction
      requireProxy: IPluginRequireFunction
      customRequire: IPluginRequireFunction
      nodeRequire: IPluginRequireFunction
      webpackRequire: IPluginRequireFunction
    }
  }

  private readonly setupDeferred_ = new Deferred<void>()

  private pluginRequire(target: NodeJS.Require, _thisArg: any, ...args: any[]) {
    const moduleName = asOption(args[0])
            .mapIf(it => isArray(it) && !isString(it), (it:any[]) => it[0])
            .filter(isString)
        .filter(isNotEmpty)
        .getOrThrow("This first argument to require must be a string with at least 1 character"),
      { state } = this,
      { moduleIdCache } = state,
      { nodeRequire, webpackRequire } = state.global,
      errors = Array<[string, Error]>()

    log.debug(`Attempting to load module ${moduleName}`)
    try {
      if (PluginExternalModuleNames.includes(moduleName)) {
        return pluginExternalRequire(moduleName)
      }
    } catch (err) {
      log.error(`pluginExternalRequire`, err)
    }
    
    if (moduleIdCache[moduleName]) {
      return moduleIdCache[moduleName]
    }

    let mod: any = null
    if (!isBuiltin(moduleName)) {
      try {
        
        mod = __webpack_modules__[moduleName]
        // if (!mod) {
        //   const id = __web.resolve(moduleName)
        //   assert(isNotEmpty(id), `Unable to resolve ${moduleName} inside webpack require`)
        //
        // }
        assert(!!mod, "Mod has no valid exports and is null or undefined")
        if (moduleIdCache[moduleName]) {
          return moduleIdCache[moduleName]
        }

        moduleIdCache[moduleName] = mod
        return mod
      } catch (err) {
        errors.push([`Unable to load module (${moduleName}) via webpack`, err])
      }
    }

    try {
      const id = nodeRequire.resolve(moduleName)
      assert(isNotEmpty(id), `Unable to resolve ${moduleName} inside node require`)
      mod = nodeRequire(id)
      assert(!!mod, "Mod has no valid exports and is null or undefined")
      if (moduleIdCache[id]) {
        return moduleIdCache[id]
      }

      moduleIdCache[id] = mod
      return mod
    } catch (err) {
      errors.push([`Unable to load module (${moduleName}) via node`, err])
    }

    for (const [msg, err] of errors) {
      log.error(msg, err)
    }

    log.error(`Unable to resolve ${moduleName} in any context`)
    return target(moduleName)
  }

  private async setup(): Promise<void> {
    try {
      const { manager, serviceContainer, install, state } = this,
        { manifest } = install,
        manifestName = manifest.name ?? manifest.id,
        pkgPath = install.path,
        pkgJsonFile = Path.join(pkgPath, "package.json")

      assert(await Fsx.pathExists(pkgJsonFile), `No package.json available @ ${pkgJsonFile}`)

      const pkgJson = JSON5.parse(await Fsx.readFile(pkgJsonFile, "utf-8")) as PackageJson,
        pkgMain = pkgJson.main,
        pkgMainFile = Path.join(pkgPath, pkgMain)

      assert(await Fsx.pathExists(pkgMainFile), `Main file specified in ${pkgJsonFile} does not exist @ ${pkgMainFile}`)

      log.info(`Reading plugin installation bundle @ ${pkgMainFile}`)
      const code = await Fsx.readFile(pkgMainFile, "utf-8"),
        
          vmScript = (this.state_.vm.script = new VM.Script(code, {
          filename: pkgMainFile,
          importModuleDynamically: VM.constants.USE_MAIN_CONTEXT_DEFAULT_LOADER
        })),
        vmCtxObj = this.state.vm.contextObj
      
      Object.assign(vmCtxObj, {
        __dirname: pkgPath,
        __filename: pkgMainFile
      })
      
      const
        //vmCtxProxy = this.createProxyGlobal(),
        vmCtx = (this.state_.vm.context = VM.createContext(vmCtxObj, {
          name: manifestName,codeGeneration: {
            strings: true
          }

          // TODO: Enable in future version as Node v22+ is required
          //importModuleDynamically:
          // VM.constants.USE_MAIN_CONTEXT_DEFAULT_LOADER
        }))

      let res = vmScript.runInContext(vmCtx, {
        displayErrors: true
      })

      if (isPromise(res)) {
        res = await res
      }

      const modExports = vmCtxObj?.module?.exports,
        factory: IPluginComponentFactory = (this.state.componentFactory = modExports?.default)

      assert(isFunction(factory), `Exported factory for ${manifestName} is not a function`)
      log.info(`Result from loading plugin (${manifestName})`, modExports, factory)
      this.setupDeferred_.resolve()
    } catch (err) {
      log.error(`Failed to setup plugin`, err)
      this.setupDeferred_.reject(err)
      throw err
    }
  }

  private createProxyGlobal(): Window {
    const {
      state: { global: g }
    } = this
    return new Proxy(window, {
      get: (target: any, prop: string | symbol, _receiver: any) => {
        const { contextObj } = this.state.vm
        return asOption(g[prop])
          .orCall(() => asOption(contextObj[prop]))
          .getOrCall(() => target[prop])
      },
      //
      // set: (_target: any, prop: string | symbol, newValue: any, _receiver: any): boolean => {
      //   const { global: g } = this.state
      //
      //   if (g[prop]) {
      //     log.error(`Can not set property (${prop?.toString()}), it exists on the global proxy`)
      //     return false
      //   }
      //
      //   const { contextObj } = this.state.vm
      //
      //   contextObj[prop] = newValue
      //   return true
      // }
    })
  }

  constructor(
    readonly manager: PluginClientManager,
    readonly serviceContainer: Container,
    readonly install: PluginInstall
  ) {
    //import.meta.url
    const customRequire = Module.createRequire(install.path),
      requireProxy = new Proxy(customRequire, {
        apply: this.pluginRequire.bind(this)
      }),
        globalRequire = {
          require: requireProxy,
          requireProxy,
          customRequire,
          nodeRequire: __non_webpack_require__,
          webpackRequire: __webpack_require__
        }

    this.state_ = {
      moduleIdCache: {},

      vm: {
        // context: null,
        contextObj: {
          // ...window,
          window,
          global,
          module: {
            exports: {}
          },
          ...globalRequire
        }
      },
      global: globalRequire
    }

    this.setup()
  }

  get state() {
    return this.state_
  }

  whenReady() {
    return this.setupDeferred_.promise
  }

  async getComponent(
    componentDef: PluginComponentDefinition
  ): Promise<React.ComponentType<IPluginComponentProps> | Promise<React.ComponentType<IPluginComponentProps>>> {
    await this.whenReady()
    return this.state.componentFactory(this.install.manifest, componentDef, this.serviceContainer)
  }

  static create(manager: PluginClientManager, serviceContainer: Container, install: PluginInstall): PluginLoader {
    return new PluginLoader(manager, serviceContainer, install)
  }

  static async GetComponent(
    manager: PluginClientManager,
    serviceContainer: Container,
    install: PluginInstall,
    componentDef: PluginComponentDefinition
  ): Promise<TPluginComponentType> {
    const loader = new PluginLoader(manager, serviceContainer, install)
    return await loader.getComponent(componentDef)
  }
}

type TComponentLoader = (
    install: PluginInstall,
    componentDef: PluginComponentDefinition
) => Promise<TPluginComponentType>

@Singleton()
export class PluginClientManager {
  private readonly state_ = {
    loaders: new Map<string, PluginLoader>()
  }

  private readonly builtinPluginLoaders_: Record<OverlayKind, TComponentLoader> = {
    [OverlayKind.PLUGIN]: async (
      install: PluginInstall,
      componentDef: PluginComponentDefinition
    ) => {
      const { loaders } = this.state_
      if (!loaders.has(install.id)) {
        loaders.set(install.id, PluginLoader.create(this, this.serviceContainer, install))
      }
      
      log.info(`Loading component (${componentDef?.id})`)
      const
          loader = loaders.get(install.id),
          componentType = await loader.getComponent(componentDef)
      
      log.info(`Loaded component (${componentDef?.id})`, componentType)
      return componentType
    },
    [OverlayKind.EDITOR_INFO]: () => importDefault(import("../../overlays/editor-info/EditorInfoOverlayPlugin"))
    // [OverlayKind.TRACK_MAP]: () =>
    // importDefault(import("../../overlays/track-map/TrackMapOverlayPlugin")),
    // [OverlayKind.CLOCK]: () =>
    // importDefault(import("../../overlays/clock/ClockOverlayPlugin"))
  }

  private pluginClient: IPluginClient

  private reactComponent_: React.ComponentType<IPluginComponentProps>

  private getPluginClient(): IPluginClient {
    return asOption(this.pluginClient).getOrCall(() => {
      this.pluginClient = {
        inActiveSession: () => {
          const rootState = this.appStore.getState()
          return (
            sharedAppSelectors.selectActiveSessionType(rootState) !== "NONE" &&
            !!sharedAppSelectors.selectActiveSessionInfo(rootState)
          )
        },
        getOverlayInfo: () => {
          return this.getConfig()?.overlay
        }, // fetchSessionInfo: this.fetchSessionInfo.bind(this),
        getSessionInfo: () => {
          return sharedAppSelectors.selectActiveSessionInfo(this.appStore.getState())
        },
        getSessionTiming: () => {
          return sharedAppSelectors.selectActiveSessionTiming(this.appStore.getState())
        },
        getLapTrajectory: (trackLayoutId: string) => {
          return this.trackManager.getLapTrajectory(trackLayoutId)
        },
        getTrackMap: (trackLayoutId: string) => {
          return this.trackManager.getTrackMapFromLapTrajectory(trackLayoutId)
        },
        on: <T extends keyof IPluginClientEventArgs, Fn extends IPluginClientEventArgs[T] = IPluginClientEventArgs[T]>(
          type: T,
          handler: Fn
        ) => {
          this.on<T>(type, handler as any)
        },
        off: <T extends keyof IPluginClientEventArgs, Fn extends IPluginClientEventArgs[T] = IPluginClientEventArgs[T]>(
          type: T,
          handler: Fn
        ) => {
          this.off<T>(type, handler as any)
        }
      }
      return this.pluginClient
    })
  }

  /**
   * Cleanup resources on unload
   *
   * @param event
   * @private
   */
  @Bind
  private unload(event: Event = null) {
    debug(`Unloading overlay manager client`)

    window["getVRKitPluginClient"] = undefined
  }

  /**
   * Add all app-wide actions
   * @private
   */
  @PostConstruct() // @ts-ignore
  // tslint:disable-next-line
  private async init(): Promise<void> {
    await GetPluginExternalRequire()
    assert(!!pluginExternalRequire, "pluginExternalRequire is not set")
    // tslint:disable-next-line
    window.addEventListener("beforeunload", this.unload)
    
    this.initDev()

    window["getVRKitPluginClient"] = this.getPluginClient.bind(this)

    // await this.launch().catch(err => error(`Failed to launch overlay`, err))
  }

  async launch() {
    const config = this.getConfig()
    if (!config) {
      log.warn(`No OverlayConfig available, assuming internal window`)
      return null
    }

    const { kind, componentId } = config.overlay,
        pluginsState = this.appStore.getState().shared?.plugins,
        pluginInstall = kind !== OverlayKind.PLUGIN ? null :
            asOption(pluginsState)
                .map(state => Object.values(state.plugins).find(pluginInstall => componentId.startsWith(pluginInstall.id)) as PluginInstall)
                .getOrThrow(`Unable to find PluginInstall for componentId ${componentId}`),
        componentDef = kind !== OverlayKind.PLUGIN ? null :
            pluginInstall?.manifest?.components?.find(({id}) => id === componentId)
    
    const loaderFn = this.builtinPluginLoaders_[kind]
    assert(!!loaderFn, `Loader for kind ${kind} is unknown`)
    
    const componentOrPromise = await loaderFn(pluginInstall, componentDef)

    this.reactComponent_ = isPromise(componentOrPromise) ? await componentOrPromise : componentOrPromise
    this.appStore.dispatch(overlayWindowActions.setOverlayComponent(this.reactComponent_))
  }

  /**
   * Initialize dev environment tooling
   *
   * @private
   */
  private initDev() {
    if (isDev) {
      Object.assign(global, {
        pluginClientManager: this
      })

      if (import.meta.webpackHot) {
        import.meta.webpackHot.addDisposeHandler(() => {
          this.unload()

          window.removeEventListener("beforeunload", this.unload)
          Object.assign(global, {
            pluginClientManager: null
          })
        })
      }
    }
  }

  /**
   * Service constructor
   *
   */
  constructor(
    @InjectContainer()
    readonly serviceContainer: Container,
    @Inject(APP_STORE_ID)
    readonly appStore: AppStore,
    readonly client: OverlayManagerClient,
    readonly trackManager: TrackManager
  ) {}

  @Bind
  getConfig(): OverlayConfig {
    return this.client.overlayConfig
  }

  on<Type extends keyof IPluginClientEventArgs>(type: Type, handler: OverlayManagerClientEventHandler<Type>) {
    this.client.on(type, handler as any)
  }

  off<Type extends keyof IPluginClientEventArgs>(type: Type, handler?: OverlayManagerClientEventHandler<Type>) {
    this.client.off(type, handler as any)
  }

  getReactComponent() {
    return this.reactComponent_
  }
}

export default OverlayManagerClient
