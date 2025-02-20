import { getLogger } from "@3fv/logger-proxy"
import Chokidar, { FSWatcher } from "chokidar"
import { Container, Inject, InjectContainer, PostConstruct, Singleton } from "@3fv/ditsy"
import { assert, Bind, importDefault, isNotEmpty, OverlayManagerClientEventHandler } from "@vrkit-platform/shared"

import { APP_STORE_ID, isDev } from "../../renderer-constants"
import {
  IPluginClient,
  IPluginClientEventArgs,
  IPluginComponentFactory,
  IPluginComponentProps,
  TPluginComponentType
} from "@vrkit-platform/plugin-sdk"
import {
  OverlayConfig,
  OverlayKind,
  PluginComponentDefinition,
  PluginInstall,
  PluginUserSettingValue
} from "@vrkit-platform/models"
import OverlayManagerClient from "../overlay-manager-client"
import { asOption } from "@3fv/prelude-ts"
import TrackManager from "../track-manager"
import React from "react"
import { sharedAppSelectors } from "../store/slices/shared-app"
import { AppStore } from "../store"
import { isArray, isFunction, isPromise, isString } from "@3fv/guard"
import Module, { isBuiltin } from "module"
// import VM, { Context } from "vm"
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

const PluginExternalModuleNames = VRKIT_BUNDLED_MODULE_NAMES
const PluginExternalModuleIdMap = VRKIT_BUNDLED_MODULE_ID_MAP
const PluginExternalModuleMap = VRKIT_BUNDLED_MODULE_MAP

Object.assign(window, {
  PluginExternalModuleNames,
  PluginExternalModuleIdMap,
  PluginExternalModuleMap
})

export class PluginLoader {
  private readonly state_: {
    fileWatcher: FSWatcher
    moduleIdCache: Record<string, any>
    componentFactory?: IPluginComponentFactory
    global: {
      require: IPluginRequireFunction
      requireProxy: IPluginRequireFunction
      //  customRequire: IPluginRequireFunction
      nodeRequire: IPluginRequireFunction
      webpackRequire: IPluginRequireFunction
    }
  }

  readonly #setupDeferred_ = new Deferred<void>()

  // noinspection SpellCheckingInspection
  /**
   * Handles the custom require mechanism for loading plugin modules.
   *
   * This function is designed to intercept calls to `require` and attempt to
   * resolve plugins through different mappings and caching mechanisms before
   * falling back on Node.js's native `require`.
   *
   * Steps for resolution:
   * 1. Verify that the `moduleName` argument is a valid string.
   * 2. Check if the module exists in the `PluginExternalModuleMap`. If yes,
   * return it.
   * 3. If not in the map, check for its presence in the `moduleIdCache`.
   * 4. Attempt to load the module as a Webpack module if it is not a built-in
   * module.
   * 5. Fall back to the original `target` require if none of the above resolve
   * the module.
   *
   * @param target - Original Node.js `require` function to fall back to when
   *     module resolution fails.
   * @param _thisArg - `this` argument passed to the `Function.prototype.apply`
   *     during method call.
   * @param args - Array of arguments passed to the `require` function. The
   *     first argument should be the module name.
   * @returns {any} The resolved module or throws an error if the resolution
   *     fails.
   *
   * @throws `Error` if the provided module name is not a valid string.
   */
  private pluginRequire(target: NodeJS.Require, _thisArg: any, ...args: any[]):any {
    const moduleName = asOption(args[0])
        .mapIf(
          it => isArray(it) && !isString(it),
          (it: any[]) => it[0]
        )
        .filter(isString)
        .filter(isNotEmpty)
        .getOrThrow("This first argument to require must be a string with at least 1 character"),
      { state } = this,
      { moduleIdCache } = state,
      errors = Array<[string, Error]>()

    if (log.isDebugEnabled()) {
      log.debug(`Attempting to load module ${moduleName}`)
    }

    try {
      const mod = PluginExternalModuleMap[moduleName]
      if (mod) {
        // log.info(`Resolved ${moduleName} via PluginExternalModuleMap`)
        return mod
      }
    } catch (err) {
      log.error(`pluginExternalRequire(${moduleName})`, err)
    }

    if (moduleIdCache[moduleName]) {
      return moduleIdCache[moduleName]
    }

    let mod: any = null
    if (!isBuiltin(moduleName)) {
      try {
        mod = __webpack_modules__[moduleName]
        if (!!mod) {
          moduleIdCache[moduleName] = mod
          return mod
        }
      } catch (err) {
        errors.push([`Unable to load module (${moduleName}) via webpack`, err])
      }
    }

    try {
      return target(moduleName)
    } catch (err) {
      errors.push([`FAILED TO LOAD MODULE (${moduleName}) VIA ANY/ALL MECHANISMS`, err])
      for (const [msg, err] of errors) {
        log.error(msg, err)
      }

      throw err
    }
  }

  private async setup(): Promise<void> {
    try {
      const { install, state } = this,
        { manifest } = install,
        manifestName = manifest.name ?? manifest.id,
        pkgPath = install.path,
        pkgJsonFile = Path.join(pkgPath, "package.json")

      assert(await Fsx.pathExists(pkgJsonFile), `No package.json available @ ${pkgJsonFile}`)

      const pkgJson = JSON5.parse(await Fsx.readFile(pkgJsonFile, "utf-8")) as PackageJson,
        pkgMain = pkgJson.main,
        pkgMainFile = Path.join(pkgPath, pkgMain)

      assert(await Fsx.pathExists(pkgMainFile), `Main file specified in ${pkgJsonFile} does not exist @ ${pkgMainFile}`)

      if (log.isDebugEnabled()) log.debug(`Reading plugin installation bundle @ ${pkgMainFile}`)

      // ENABLED THEN WATCH FOR CHANGES
      if (install.isDevEnabled) {
        log.info(`Plugin DEV MODE setting up file watcher`, install)
        const watcher = Chokidar.watch(pkgMainFile, {
          awaitWriteFinish: true
        })
        watcher.on("change", this.onFileWatcherChanged.bind(this)).on("error", this.onFileWatcherError.bind(this))
        state.fileWatcher = watcher
      }

      let res = this.state.global.requireProxy(pkgMainFile)
      if (isPromise(res)) {
        res = await res
      }

      const modExports = res?.exports ?? res,
        factory: IPluginComponentFactory = (this.state.componentFactory = modExports?.default)

      assert(isFunction(factory), `Exported factory for ${manifestName} is not a function`)
      if (log.isDebugEnabled()) {
        log.debug(`Result from loading plugin (${manifestName})`, modExports, factory)
      }

      this.#setupDeferred_.resolve()
    } catch (err) {
      log.error(`Failed to setup plugin`, err)
      this.#setupDeferred_.reject(err)
      throw err
    }
  }

  /**
   * Handles errors that occur within the file watcher.
   *
   * @param {Error} err - The error object representing the issue encountered
   *     by the file watcher.
   * @return {void} This method does not return a value.
   */
  private onFileWatcherError(err: Error): void {
    log.error(`File watcher error occurred`, err)
  }

  /**
   * Handles the event triggered when a file watcher detects a change in the
   * specified file.
   *
   * @param {string} file - The file path that was changed.
   * @return {void} This method does not return a value.
   */
  private onFileWatcherChanged(file: string): void {
    log.info(`File watcher change event: ${file}`)
    window.location.reload()
  }
  
  /**
   * Constructor for initializing the plugin system and setting up custom module resolution.
   *
   * @param {PluginClientLauncher} manager - The plugin client launcher responsible for managing plugin clients.
   * @param {Container} serviceContainer - The service container providing dependencies and services.
   * @param {PluginInstall} install - The plugin installation details used to configure the environment.
   */
  constructor(
    readonly manager: PluginClientLauncher,
    readonly serviceContainer: Container,
    readonly install: PluginInstall
  ) {
    const
      requireProxy = new Proxy(Module.prototype.require.bind(module), {
        apply: this.pluginRequire.bind(this)
      }),
      globalRequire = {
        require: requireProxy,
        requireProxy,
        nodeRequire: __non_webpack_require__,
        webpackRequire: __webpack_require__
      }

    // ASSIGN ALL REQUIRE FNs TO WINDOW/GLOBAL OBJECT
    const defaultRequire = Module.prototype.require

    function newRequire(id: string) {
      try {
        return requireProxy(id)
      } catch (err) {
        console.warn(`Require proxy failed (${id}), falling back`, err)
        return defaultRequire(id)
      }
    }

    newRequire.cache = defaultRequire.cache
    newRequire.resolve = defaultRequire.resolve
    newRequire.extensions = defaultRequire.extensions
    newRequire.main = defaultRequire.main
    Module.prototype.require = newRequire as any
    Object.assign(global, globalRequire)
    Object.assign(window, globalRequire)

    this.state_ = {
      fileWatcher: null,
      moduleIdCache: {},
      global: globalRequire
    }

    this.setup()
  }

  get state() {
    return this.state_
  }

  whenReady() {
    return this.#setupDeferred_.promise
  }

  async getComponent(
    componentDef: PluginComponentDefinition
  ): Promise<React.ComponentType<IPluginComponentProps> | Promise<React.ComponentType<IPluginComponentProps>>> {
    await this.whenReady()
    return this.state.componentFactory(this.install.manifest, componentDef, this.serviceContainer)
  }

  static create(manager: PluginClientLauncher, serviceContainer: Container, install: PluginInstall): PluginLoader {
    return new PluginLoader(manager, serviceContainer, install)
  }

  static async GetComponent(
    manager: PluginClientLauncher,
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
export class PluginClientLauncher {
  private readonly state_ = {
    loaders: new Map<string, PluginLoader>()
  }

  private readonly builtinPluginLoaders_: Record<OverlayKind, TComponentLoader> = {
    [OverlayKind.PLUGIN]: async (install: PluginInstall, componentDef: PluginComponentDefinition) => {
      const { loaders } = this.state_
      if (!loaders.has(install.id)) {
        loaders.set(install.id, PluginLoader.create(this, this.serviceContainer, install))
      }

      log.info(`Loading component (${componentDef?.id})`)
      const loader = loaders.get(install.id),
        componentType = await loader.getComponent(componentDef)

      log.info(`Loaded component (${componentDef?.id})`, componentType)
      return componentType
    },
    [OverlayKind.EDITOR_INFO]: () => importDefault(import("../../overlays/editor-info/EditorInfoOverlayPlugin"))
  }

  private pluginClient: IPluginClient

  private reactComponent_: React.ComponentType<IPluginComponentProps>

  /**
   * Get/Create an implementation of `IPluginClient`
   *
   * @private
   */
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
        },

        getUserSettingValue: (id: string): PluginUserSettingValue => {
          return this.getConfig()?.overlay?.userSettingValues?.[id]
        },

        getSessionInfo: () => {
          return sharedAppSelectors.selectActiveSessionInfo(this.appStore.getState())
        }, // getSessionTimeAndDuration: () => {
        //   return
        // sharedAppSelectors.selectActiveSessionTimeAndDuration(this.appStore.getState())
        // },
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
  protected async init(): Promise<void> {
    window.addEventListener("beforeunload", this.unload)

    this.initDev()

    window["getVRKitPluginClient"] = this.getPluginClient.bind(this)
  }

  /**
   * Launch - runs in an overlay window only
   */
  async launch() {
    const config = this.getConfig()
    if (!config) {
      log.warn(`No OverlayConfig available, assuming internal window`)
      return null
    }

    const { kind, componentId } = config.overlay,
      pluginsState = this.appStore.getState().shared?.plugins,
      pluginInstall =
        kind !== OverlayKind.PLUGIN
          ? null
          : asOption(pluginsState)
              .map(
                state =>
                  Object.values(state.plugins).find(pluginInstall =>
                    componentId.startsWith(pluginInstall.id)
                  ) as PluginInstall
              )
              .getOrThrow(`Unable to find PluginInstall for componentId ${componentId}`),
      componentDef =
        kind !== OverlayKind.PLUGIN ? null : pluginInstall?.manifest?.components?.find(({ id }) => id === componentId)

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
