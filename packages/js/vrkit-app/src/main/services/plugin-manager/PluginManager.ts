import { getLogger } from "@3fv/logger-proxy"
import { PostConstruct, Singleton } from "@3fv/ditsy"

import { Bind, Disposables, isNotEmpty, isTrue, PluginsState } from "vrkit-shared"
import {FileSystemManager} from "vrkit-shared/services/node"
import {AppPaths} from "vrkit-shared/constants/node"
import { IObjectDidChange, remove, runInAction, set } from "mobx"
import SharedAppState from "../store"
import { PluginInstall, PluginInstallStatus, PluginManifest } from "vrkit-models"
import { asOption, Future } from "@3fv/prelude-ts"

import Fs from "fs"
import Path from "path"
import { flatten, uniq } from "lodash"
import { isDefined, isPromise } from "@3fv/guard"
import FastGlob from "fast-glob"

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
  private removePluginInstalls(...ids: string[]) {
    return runInAction(() => {
      for (const pluginId of ids) {
        remove(this.state.plugins, pluginId)
      }

      return this
    })
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
