import { getLogger } from "@3fv/logger-proxy"
import { PostConstruct, Singleton } from "@3fv/ditsy"
import Fsx from "fs-extra"
import {
  Bind,
  Disposables,
  isNotEmpty,
  isTrue,
  PluginsState,
  PluginManagerFnType, PluginManagerFnTypeToIPCName
} from "@vrkit-platform/shared"
import {FileSystemManager} from "@vrkit-platform/shared/services/node"
import {AppPaths} from "@vrkit-platform/shared/constants/node"
import { IObjectDidChange, remove, runInAction, set } from "mobx"
import SharedAppState from "../store"
import { PluginInstall, PluginInstallStatus, PluginManifest } from "@vrkit-platform/models"
import { asOption, Future } from "@3fv/prelude-ts"

import Fs from "fs"
import Path from "path"
import { flatten, uniq } from "lodash"
import { isDefined, isPromise } from "@3fv/guard"
import FastGlob from "fast-glob"
import { app, net, ipcMain, IpcMainInvokeEvent } from "electron"
import { Deferred } from "@3fv/deferred"



// noinspection TypeScriptUnresolvedVariable
const log = getLogger(__filename)
// noinspection JSUnusedLocalSymbols
const { debug, trace, info, error, warn } = log

@Singleton()
export class PluginManager {
  private readonly disposers_ = new Disposables()

  get state() {
    return this.sharedAppState.plugins
  }

  @Bind
  private updatePluginInstalls(...plugins: PluginInstall[]) {
    return runInAction(() => {
      for (const plugin of plugins) {
        set(this.state.plugins, plugin.id, plugin)
      }
      return this
    })
  }
  
  @Bind
  private async installPlugin(id: string): Promise<PluginInstall> {
    const manifest = this.state.availablePlugins[id]
    log.assert(!!manifest, `No plugin manifest found for (${id})`)
    
    const tmpDir = await Fsx.mkdtemp(`vrkit-plugin-install-${id}-`),
      {
        overview: { downloadUrl }
      } = manifest
    
    log.info(`Downloading plugin (${manifest.name}) @ ${downloadUrl}`)
    const
        downloadPath = Path.join(tmpDir, `${id}.zip`),
        downloadFile = await Fs.promises.open(downloadPath,'wb'),
        downloadDeferred = new Deferred<void>()
    try {
      const downloadReq = net.request(downloadUrl)
      
      
      downloadReq.on('response', (response) => {
        log.info(`STATUS: ${response.statusCode}, HEADERS: ${JSON.stringify(response.headers)}`)
        response.on('error', (err: Error) => {
          log.error(`Download (${downloadUrl}) failed`, err)
          downloadDeferred.reject(err)
        })
        response.on('data', (chunk) => {
          log.debug(`chunk received (${chunk.length}) bytes`)
          downloadFile.appendFile(chunk)
        })
        response.on('end', () => {
          log.info(`Download completed ${downloadUrl}`)
          downloadDeferred.resolve()
        })
      })
      downloadReq.end()
      
      await downloadDeferred.promise
    } catch (err) {
      log.error(`Download (${downloadUrl}) failed to complete`, err)
      if (!downloadDeferred.isSettled()) {
        downloadDeferred.reject(err)
      }
      
      throw err
    } finally {
      await downloadFile.close()
    }
    
    log.assert(await Fsx.pathExists(downloadPath), `Downloaded plugin @ ${downloadPath} is missing`)
    
    return null
  }
  
  @Bind
  private async uninstallPlugins(...ids: string[]): Promise<this> {
    const pluginInstalls = ids.map(id => this.state.plugins[id]).filter(isDefined<PluginInstall>)
    runInAction(() => {
      for (const pluginId of ids) {
        remove(this.state.plugins, pluginId)
      }
    })
    
    await Promise.all(pluginInstalls.map(async install => {
      log.info(`Uninstalling plugin (${install.id}) @ ${install.path}`)
      if (!await Fsx.pathExists(install.path)) {
        log.warn(`Plugin path does not exist ${install.path}`)
        return
      }
      
      await Fsx.rm(install.path, {
        retryDelay: 100,
        recursive: true,
        force: true
      })
      
      log.info(`Uninstalled plugin (${install.id}) @ ${install.path}`)
    }))
    
    return this
  }
  
  private async refreshAvailablePluginsHandler(event: IpcMainInvokeEvent, id: string): Promise<void> {
  
  }
  
  private async uninstallPluginHandler(event: IpcMainInvokeEvent, id: string): Promise<void> {
    this.uninstallPlugins(id)
  }
  
  private async installPluginHandler(event: IpcMainInvokeEvent, id: string): Promise<PluginInstall> {
    return null
  }

  /**
   * On state change, emit to renderers
   *
   * @param change
   */
  @Bind
  private onStateChange(change: IObjectDidChange<PluginsState>) {}

  /**
   * Resource cleanup
   */
  [Symbol.dispose]() {
    this.disposers_.dispose()
  }

  /**
   * Simply calls dispose
   * @private
   */
  private unload() {
    this[Symbol.dispose]()
  }

  /**
   * Initialize
   */
  @PostConstruct()
  private async init() {
    info(`Finding plugins`)
    await this.findPlugins()
    if (isDev) {
      Object.assign(global, {
        pluginManager: this
      })
    }
    
    const ipcFnHandlers = Array<[PluginManagerFnType, (event: IpcMainInvokeEvent, ...args: any[]) => any]>(
        [PluginManagerFnType.INSTALL_PLUGIN, this.installPluginHandler.bind(this)],
        [PluginManagerFnType.UNINSTALL_PLUGIN, this.uninstallPluginHandler.bind(this)],
        [PluginManagerFnType.REFRESH_AVAILABLE_PLUGINS, this.refreshAvailablePluginsHandler.bind(this)]
    )
    
    app.on("quit", this.unload)
    this.disposers_.push(() => {
      app.off("quit", this.unload)
      ipcFnHandlers.forEach(([type]) => ipcMain.removeHandler(PluginManagerFnTypeToIPCName(type)))
    })
    
    ipcFnHandlers.forEach(([type, handler]) => ipcMain.handle(PluginManagerFnTypeToIPCName(type), handler))
    
    if (import.meta.webpackHot) {
      import.meta.webpackHot.addDisposeHandler(() => {
        this[Symbol.dispose]()
      })
    }
  }

  constructor(
    readonly fileManager: FileSystemManager,
    readonly sharedAppState: SharedAppState
  ) {}

  /**
   * Load a plugin from the manifest file
   *
   * @param manifestFile
   */
  async loadPlugin(manifestFile: string): Promise<PluginInstall> {
    const pluginDir = Path.dirname(manifestFile),
      checks = await Promise.all([
        Fs.promises.lstat(pluginDir).then(stat => stat.isDirectory()),
        Fs.promises.lstat(manifestFile).then(stat => stat.isFile())
      ])

    log.assert(checks.every(isTrue), `Plugin & manifest paths are invalid: ${[manifestFile, pluginDir].join(", ")}`)

    const manifestObj = await (asOption(manifestFile)
        .map(file =>
          /\.json5?$/.test(file)
            ? this.fileManager.readJSON(file)
            : /\.ya?ml$/.test(file)
              ? this.fileManager.readJSON(file)
              : null
        )
        .filter(isPromise)
        .getOrThrow(`Unable to load ${manifestFile}`) as Promise<any>),
      manifest = PluginManifest.fromJson(manifestObj)

    return PluginInstall.create({
      id: manifest.id,
      status: PluginInstallStatus.PLUGIN_STATUS_AVAILABLE,
      path: pluginDir,
      manifestFile,
      manifest
    })
  }

  /**
   * Refresh available plugins
   *
   * @param overrideSearchPaths optionally override the search path defaults
   */
  @Bind
  async findPlugins(...overrideSearchPaths: string[]) {
    const searchPaths = await Promise.all(
      asOption(overrideSearchPaths)
        .filter(isNotEmpty)
        .orElse(() => asOption([...AppPaths.pluginSearchPaths]))

        .getOrThrow(`No paths available`)
        .map(
          (
            path // Stat the inode to see if its a directory
          ) => Fs.promises.lstat(path).then(stat => (stat.isDirectory() ? path : null))
        )
    )

    info(`Searching (${searchPaths.join(",")}) for plugins`)
    log.assert(isNotEmpty(searchPaths), "Search paths are invalid.  At least one valid directory is required")

    const installs = await Future.of(
      Promise.all(
        uniq(
          flatten(
            searchPaths.map(path => [
              ...FastGlob.globSync("*/plugin.{json,json5,yaml,yml}", {
                cwd: path
              }).map(file => Path.join(path, file)),
              ...FastGlob.globSync("plugin.{json,json5,yaml,yml}", {
                cwd: path
              }).map(file => Path.join(path, file))
            ])
          )
        ).map(file => {
          log.info(`Loading plugin manifest: ${file}`)
          return this.loadPlugin(file)
        })
      )
    )
      .map(it => it.filter(isDefined<PluginInstall>))
      .toPromise()

    this.updatePluginInstalls(...installs)
  }
}

export default PluginManager
