import { getLogger } from "@3fv/logger-proxy"
import { PostConstruct, Singleton } from "@3fv/ditsy"
import Fsx from "fs-extra"
import {
  Bind,
  Disposables,
  isArray,
  isNotEmpty,
  isTrue,
  isURL,
  PluginManagerFnType,
  PluginManagerFnTypeToIPCName,
  PluginsState
} from "@vrkit-platform/shared"
import { createTempDirectory, FileSystemManager, unzipFile } from "@vrkit-platform/shared/services/node"
import { AppFiles, AppPaths } from "@vrkit-platform/shared/constants/node"
import { IObjectDidChange, remove, runInAction, set } from "mobx"
import SharedAppState from "../store"
import { PluginInstall, PluginInstallStatus, PluginManifest } from "@vrkit-platform/models"
import { asOption, Future } from "@3fv/prelude-ts"

import Fs from "fs"
import Path from "path"
import { flatten, uniq } from "lodash"
import { isDefined, isPromise } from "@3fv/guard"
import FastGlob from "fast-glob"
import { app, ipcMain, IpcMainInvokeEvent, net } from "electron"
import { Deferred } from "@3fv/deferred"
import { PluginManifestsURL } from "../../constants"
import PQueue from "p-queue"

// noinspection TypeScriptUnresolvedVariable
const log = getLogger(__filename)
// noinspection JSUnusedLocalSymbols
const { debug, trace, info, error, warn } = log

function toPluginManifestMap(manifests: PluginManifest[]): Record<string, PluginManifest> {
  return manifests.reduce(
    (map, manifest) => ({
      ...map,
      [manifest.id]: manifest
    }),
    {} as Record<string, PluginManifest>
  )
}

@Singleton()
export class PluginManager {
  private readonly disposers_ = new Disposables()

  private readonly taskQueue = new PQueue({
    concurrency: 1
  })

  get state() {
    return this.sharedAppState.plugins
  }

  /**
   * Update `PluginInstall` in shared state
   * @param plugins
   * @private
   */
  @Bind
  private setPluginInstalls(...plugins: PluginInstall[]) {
    return runInAction(() => {
      for (const plugin of plugins) {
        set(this.state.plugins, plugin.id, plugin)
      }
      return this
    })
  }

  /**
   * Download, unzip & install plugin
   *
   * @param id
   */
  @Bind
  async installPlugin(id: string): Promise<PluginInstall> {
    const install = await this.taskQueue.add(async () => {
      const existingInstall = this.state.plugins[id]
      if (!!existingInstall) {
        log.error(`Plugin ${existingInstall.manifest.name} (${id}) is already installed`)
        return existingInstall
      }
      const manifest = this.state.availablePlugins[id]
      log.assert(!!manifest, `No plugin manifest found for (${id})`)

      const tmpDir = await createTempDirectory(`vrkit-plugin-install-${id}-`),
        { downloadUrl } = manifest.overview ?? {}

      log.assert(isURL(downloadUrl), `invalid downloadUrl (${downloadUrl})`)

      log.info(`Downloading plugin (${manifest.name}) @ ${downloadUrl}`)
      const downloadPath = Path.join(tmpDir, `${id}.zip`),
        downloadFile = await Fs.promises.open(downloadPath, "wb"),
        downloadDeferred = new Deferred<void>()
      try {
        const downloadReq = net.request(downloadUrl)

        downloadReq.on("response", response => {
          log.info(`STATUS: ${response.statusCode}, HEADERS: ${JSON.stringify(response.headers)}`)
          response
            .on("error", (err: Error) => {
              log.error(`Download (${downloadUrl}) failed`, err)
              downloadDeferred.reject(err)
            })
            .on("data", chunk => {
              log.debug(`chunk received (${chunk.length}) bytes`)
              downloadFile.appendFile(chunk)
            })
            .on("end", () => {
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

      const pluginDir = Path.join(AppPaths.pluginsDir, Path.basename(downloadPath, ".zip")),
        pluginManifestFile = Path.join(pluginDir, "plugin.json5")

      await Fsx.mkdirp(pluginDir)
      log.info(`Unziping plugin @ (${downloadPath}) -> (${pluginDir})`)

      try {
        await unzipFile(downloadPath, pluginDir)
        log.assert(
          await Fsx.pathExists(pluginManifestFile),
          `Unzip succeeded, but no manifest file found @ ${pluginManifestFile}`
        )
      } catch (err) {
        log.error(`Unzip failed, cleaning up now`, err)
        await Fsx.rm(pluginDir, {
          recursive: true,
          force: true
        }).catch(cleanupErr => {
          log.error(`Plugin error cleanup failed`, cleanupErr)
        })

        throw err
      }

      log.info(`Loading installed plugin ${manifest.name} (${id}) manifest file (${pluginManifestFile})`)
      const install = await this.loadPlugin(pluginManifestFile)
      //if (log.isDebugEnabled())
      log.info(`Loaded PluginInstall ${manifest.name} (${id}) from manifest file (${pluginManifestFile})`, install)

      log.info(`Registering new PluginInstall ${manifest.name} (${id})`)
      this.setPluginInstalls(install)

      return PluginInstall.toJson(install, {emitDefaultValues: true}) as any as PluginInstall
    })

    return install as PluginInstall
  }

  @Bind
  async uninstallPlugins(...ids: string[]): Promise<this> {
    await this.taskQueue.add(async () => {
      
      const pluginInstalls = ids.map(id => this.state.plugins[id]).filter(isDefined<PluginInstall>)
      if (!ids.length || pluginInstalls.length !== ids.length) {
        log.warn(`# of requested plugin uninstallation ids does not match the # of corresponding PluginInstall records`)
        return
      }
      
      runInAction(() => {
        for (const pluginId of ids) {
          remove(this.state.plugins, pluginId)
        }
      })

      await Promise.all(
        pluginInstalls.map(async install => {
          log.info(`Uninstalling plugin (${install.id}) @ ${install.path}`)
          if (!(await Fsx.pathExists(install.path))) {
            log.warn(`Plugin path does not exist ${install.path}`)
            return
          }

          await Fsx.rm(install.path, {
            retryDelay: 100,
            recursive: true,
            force: true
          })

          log.info(`Uninstalled plugin (${install.id}) @ ${install.path}`)
        })
      )
    })
    return this
  }

  async loadAvailablePlugins(): Promise<Record<string, PluginManifest>> {
    return (await this.taskQueue.add(async (): Promise<Record<string, PluginManifest>> => {
      if (!(
          await Fsx.pathExists(AppFiles.pluginsJSONFile)
      )) {
        log.warn(`Plugin file does not exist ${AppFiles.pluginsJSONFile}`)
        return {}
      }
      
      const manifestsJson = await Fsx.readJson(AppFiles.pluginsJSONFile)
      log.assert(isArray(manifestsJson), `manifestsJson is not an array`)
      const manifestMap = toPluginManifestMap(manifestsJson)
      return runInAction(() => {
        set(this.sharedAppState.plugins, "availablePlugins", manifestMap)
        return manifestMap
      })
    })) as Record<string, PluginManifest>
  }

  async refreshAvailablePlugins(): Promise<void> {
    await this.taskQueue.add(async () => {
      try {
        const res = await net.fetch(PluginManifestsURL)
        
        log.assert(res.ok, `Query for PluginManifests failed`)
        const json = await res.json()
        
        log.assert(
            isArray(json),
            `PluginManifests failed, json should be an array`
        )
        const manifests = json.map((it:any) => PluginManifest.fromJson(it, {ignoreUnknownFields: true}))
        
        await Fsx.writeJson(AppFiles.pluginsJSONFile, json, {
          spaces: 2
        })
        
        runInAction(() => {
          set(
              this.state,
              "availablePlugins",
              toPluginManifestMap(manifests)
          )
        })
      } catch (err) {
        log.error("Unable to refresh available plugins", err)
      }
    })
  }

  private async refreshAvailablePluginsHandler(_event: IpcMainInvokeEvent): Promise<void> {
    await this.refreshAvailablePlugins()
  }

  private async uninstallPluginHandler(_event: IpcMainInvokeEvent, id: string): Promise<void> {
    await this.uninstallPlugins(id)
  }

  private async installPluginHandler(_event: IpcMainInvokeEvent, id: string): Promise<PluginInstall> {
    return await this.installPlugin(id)
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

    await this.loadAvailablePlugins()
    this.refreshAvailablePlugins()
        .then(() => log.info(`Available plugins successfully loaded (${Object.keys(this.state.availablePlugins).length})`))
        .catch(err => log.error(`Unable to refresh available plugins`, err))
    
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
      manifest = PluginManifest.fromJson(manifestObj, {ignoreUnknownFields: true})

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

    this.setPluginInstalls(...installs)
  }
}

export default PluginManager
