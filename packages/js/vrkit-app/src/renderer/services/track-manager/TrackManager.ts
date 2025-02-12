import { getLogger } from "@3fv/logger-proxy"

import Fs from "fs-extra"

import { Inject, PostConstruct, Singleton } from "@3fv/ditsy"
import { Bind, IAppStorage, LapTrajectoryConverter } from "@vrkit-platform/shared"
import { isDev } from "../../renderer-constants"
import EventEmitter3 from "eventemitter3"
import { FileObject, FileSystemManager } from "@vrkit-platform/shared/services/node"
import { LapTrajectory, TrackMapFile } from "@vrkit-platform/models"
import Path from "path"
import { Deferred } from "@3fv/deferred"
import { endsWith } from "lodash/fp"
import { isString } from "@3fv/guard"
import { uniqBy } from "lodash"
import { SharedAppStateClient } from "../shared-app-state-client"

// noinspection TypeScriptUnresolvedVariable
const log = getLogger(__filename)

// noinspection JSUnusedLocalSymbols
const { debug, trace, info, error, warn } = log

export enum TrackEventType {
  TRACK_CHANGE = "TRACK_CHANGE"
}

export interface TrackManagerEventArgs {
  [TrackEventType.TRACK_CHANGE]: (trackManager: TrackManager) => void
}

@Singleton()
export class TrackManager extends EventEmitter3<TrackManagerEventArgs> {
  private trackFileMap: { [id: string]: TrackMapFile } = {}

  private trackFiles: TrackMapFile[] = []

  private appStorage: IAppStorage

  private readyDeferred: Deferred<TrackManager> = null

  /**
   * Cleanup resources on unload
   *
   * @param event
   * @private
   */
  @Bind
  private unload(event: Event) {
    debug(`Unloading file system manager`)
  }

  /**
   * Add all app-wide actions
   * @private
   */
  @PostConstruct()
  protected async init() {
    if (isDev) {
      Object.assign(global, {
        trackManager: this
      })
    }

    this.appStorage = await this.sharedAppStateClient.fetchAppStorage()
    await this.reloadDatabase(true)
    if (typeof window !== "undefined") {
      window.addEventListener("beforeunload", this.unload)
    }
  }

  /**
   * Service constructor
   *
   * @param fsManager
   */
  constructor(
    @Inject(FileSystemManager)
    readonly fsManager: FileSystemManager,
    readonly sharedAppStateClient: SharedAppStateClient
  ) {
    super()
  }

  /**
   * Get the underlying database file
   * @private
   */
  private getDatabaseFileAccess() {
    return this.fsManager.getFileObject(this.appStorage.files.trackMapListFile)
  }

  /**
   * Rebuild the database from disk (EXPENSIVE)
   */
  async rebuildDatabase(): Promise<TrackMapFile[]> {
    if (TARGET_PLATFORM !== "electron-renderer") {
      log.warn(`TrackManager only works in renderer`)
      return []
    }
    const dataFile = this.getDatabaseFileAccess()
    const tmFiles = Array<string>()
    for (const tmDir of this.appStorage.paths.trackMapsSearchPath) {
      // const tmDir = AppPaths.trackMapsDir
      const tmDirFiles = await Fs.promises
        .readdir(tmDir)
        .then(files => files.filter(endsWith(".trackmap")).map(f => Path.join(tmDir, f)))
      tmFiles.push(...tmDirFiles)
    }
    let tmfs = await Promise.all(
      tmFiles.map(async tmFile => {
        const ltData = await Fs.promises.readFile(tmFile)
        const lt = LapTrajectory.fromBinary(ltData)
        return TrackMapFile.create({
          fileInfo: await this.fsManager.getFileInfo(tmFile),
          trackLayoutMetadata: lt.trackLayoutMetadata
        })
      })
    )

    tmfs = uniqBy(tmfs, tmf => tmf.trackLayoutMetadata?.id)

    const jsonL = tmfs.reduce((data: string, tmf) => {
      if (data.length) {
        data += "\n"
      }

      return (
        data +
        TrackMapFile.toJsonString(tmf, {
          prettySpaces: 0
        })
      )
    }, "")

    await dataFile.writeText(jsonL)

    log.info(`Created jsonl file for ${tmfs.length} track maps`, dataFile.filePath)
    this.setTrackMapFiles(tmfs)
    return tmfs
  }

  /**
   * List all track map files
   */
  async list(): Promise<TrackMapFile[]> {
    if (!this.readyDeferred) {
      await this.reloadDatabase(true)
    }
    await this.readyDeferred.promise
    // await this.reloadDatabase()

    return this.trackFiles ?? []
  }

  /**
   * Internally hydrates a map of `id => TrackMapFile`
   *
   * @param tmfs
   * @private
   */
  private setTrackMapFiles(tmfs: TrackMapFile[]): void {
    this.trackFiles = tmfs
    this.trackFileMap = tmfs.reduce(
      (map, tmf) => ({
        ...map,
        [tmf.trackLayoutMetadata.id]: tmf
      }),
      {} as any
    )
  }

  /**
   * Reload the database file (json lines) from disk
   * @param ignoreCache
   */
  async reloadDatabase(ignoreCache: boolean = false): Promise<TrackManager> {
    const firstLoad = !this.readyDeferred,
      deferred = this.readyDeferred ?? (this.readyDeferred = new Deferred())
    if (!firstLoad) {
      if (ignoreCache) {
        await deferred.promise
      } else {
        return await deferred.promise
      }
    }

    try {
      if (ignoreCache || firstLoad) {
        log.info("Rebuilding track map database")
        await this.rebuildDatabase()
      }

      const dataFile = this.getDatabaseFileAccess()
      if (!(await dataFile.exists)) {
        return this
      }

      const buf = await dataFile.readBytes()
      const jsonl = buf.toString()
      const lines = jsonl.split("\n").filter(it => it?.startsWith("{") && it.endsWith("}"))

      const files = lines.map(line =>
        TrackMapFile.fromJsonString(line, {
          ignoreUnknownFields: true
        })
      )
      log.info(`Loaded track map files`, files)
      this.setTrackMapFiles(files)
      deferred.resolve(this)
    } catch (err) {
      log.error(`Failed to load track map database`, err)
      deferred.reject(err)
    }
    return deferred.promise
  }

  /**
   * Get `TrackMapFile` by layout id
   *
   * @param id
   */
  getTrackMapFile(id: string): TrackMapFile {
    return this.trackFileMap ? this.trackFileMap[id] : null
  }

  /**
   * Load the `LapTrajectory` that `TrackMapFile` for `id` points to
   *
   * @param id
   */
  async getLapTrajectory(id: string): Promise<LapTrajectory> {
    const tmf = this.getTrackMapFile(id)
    if (!tmf) {
      return null
    }

    const fileAccess = new FileObject(tmf.fileInfo.file)
    if (!(await fileAccess.exists)) {
      log.error(`Lap trajectory file does not exist (${tmf.fileInfo.file}) for id: ${id}`)
      return null
    }

    const lt = LapTrajectory.fromBinary(await fileAccess.readBytes())
    log.info(`Loaded trajectory (${id})`)

    return lt
  }

  /**
   * Get a track map from lap trajectory or id
   *
   * @param idOrTrajectory
   * @returns {Promise<TrackMap>}
   */
  async getTrackMapFromLapTrajectory(idOrTrajectory: string | LapTrajectory) {
    let trajectory: LapTrajectory
    if (isString(idOrTrajectory)) {
      trajectory = await this.getLapTrajectory(idOrTrajectory)
    } else {
      trajectory = idOrTrajectory
    }

    const converter = new LapTrajectoryConverter(20)
    return converter.toTrackMap(trajectory)
  }
}

export default TrackManager
