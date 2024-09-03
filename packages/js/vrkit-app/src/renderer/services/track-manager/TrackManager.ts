import { getLogger } from "@3fv/logger-proxy"

import Fs from "fs-extra"

import { Inject, PostConstruct, Singleton } from "@3fv/ditsy"
import { Bind } from "vrkit-app-common/decorators"
import {
  APP_STORE_ID, AppFiles,
  AppPaths,
  isDev
} from "vrkit-app-renderer/constants"
import type { AppStore } from "../store"
import EventEmitter3 from "eventemitter3"
import { FileAccess, FileSystemManager } from "../file-system-manager"
import { FileInfo, LapTrajectory, TrackMapFile } from "vrkit-models"
import Path from "path"
import { Deferred } from "@3fv/deferred"
import { endsWith } from "lodash/fp"

// noinspection TypeScriptUnresolvedVariable
const log = getLogger(__filename)

// noinspection JSUnusedLocalSymbols
const { debug, trace, info, error, warn } = log

// export enum TrackType {
//   Road = "Road",
//   Oval = "Oval",
//   DirtRoad = "DirtRoad",
//   DirtOval = "DirtOval"
// }

export enum TrackEventType {
  TrackChange = "TrackChange"
}

export interface TrackManagerEventArgs {
  [TrackEventType.TrackChange]: (trackManager: TrackManager) => void
}

@Singleton()
export class TrackManager extends EventEmitter3<TrackManagerEventArgs> {
  
  private trackFileMap: { [id: string]: TrackMapFile } = {}
  private trackFiles: TrackMapFile[] = []
  
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
  private async init() {
    if (isDev) {
      Object.assign(global, {
        trackManager: this
      })
    }
    
    this.readyDeferred = new Deferred()
    await this.reloadDatabase(true)
    if (typeof window !== "undefined") {
      window.addEventListener("beforeunload", this.unload)
    }
  }

  /**
   * Service constructor
   *
   * @param appStore
   * @param fsManager
   */
  constructor(
    @Inject(APP_STORE_ID) readonly appStore: AppStore,
    @Inject(FileSystemManager) readonly fsManager: FileSystemManager
  ) {
    super()
  }
  
  /**
   * Get the underlying database file
   * @private
   */
  private getDatabaseFileAccess() {
    return this.fsManager.getFileAccess(AppFiles.trackMapListFile)
  }
  
  /**
   * Rebuild the database from disk (EXPENSIVE)
   */
  async rebuildDatabase(): Promise<TrackMapFile[]> {
    
    const dataFile = this.getDatabaseFileAccess()
    const tmDir = AppPaths.trackMapsDir
    const tmFiles = await Fs.promises.readdir(tmDir)
        .then(files => files.filter(endsWith(".trackmap"))
            .map(f => Path.join(tmDir, f)))
    
    const tmfs = await Promise.all(tmFiles.map(async tmFile => {
      const ltData = await Fs.promises.readFile(tmFile)
      const lt = LapTrajectory.fromBinary(ltData)
      return TrackMapFile.create({
        fileInfo: await this.fsManager.getFileInfo(tmFile),
        trackLayoutMetadata: lt.trackLayoutMetadata
      })
    }))
    
    const jsonL = tmfs.reduce((data:string, tmf) => {
      if (data.length)
        data += '\n'
      
      return data + TrackMapFile.toJsonString(tmf, {
        prettySpaces: 0
      })
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
    await this.readyDeferred.promise
    await this.reloadDatabase()
    
    return this.trackFiles ?? []
    
  }
  
  /**
   * Internally hydrates a map of `id => TrackMapFile`
   *
   * @param tmfs
   * @private
   */
  private setTrackMapFiles(tmfs:TrackMapFile[]):void {
    this.trackFiles = tmfs
    this.trackFileMap = tmfs.reduce((map, tmf) => ({
      ...map,
      [tmf.trackLayoutMetadata.id]: tmf
    }), {} as any)
  }
  
  /**
   * Reload the database file (json lines) from disk
   * @param ignoreCache
   */
  async reloadDatabase(ignoreCache: boolean = false): Promise<TrackManager> {
    if (!ignoreCache && this.readyDeferred.isFulfilled()) {
      return this
    }
    
    const dataFile = this.getDatabaseFileAccess()
    if (!await dataFile.exists) {
      return this
    }
    
    const buf = await dataFile.readBytes()
    const jsonl = buf.toString()
    const lines = jsonl.split("\n").filter(it => it?.startsWith("{") && it.endsWith("}"))
    
    const files = lines.map(line => TrackMapFile.fromJsonString(line, {
      ignoreUnknownFields: true
    }))
    log.info(`Loaded track map files`, files)
    this.setTrackMapFiles(files)
    return this
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
    if (!tmf)
      return null
    
    const fileAccess = new FileAccess(tmf.fileInfo.file)
    if (!await fileAccess.exists) {
      log.error(`Lap trajectory file does not exist (${tmf.fileInfo.file}) for id: ${id}`)
      return null
    }
    
    const lt = LapTrajectory.fromBinary(await fileAccess.readBytes())
    log.info(`Loaded trajectory (${id})`)
    
    return lt
  }
  
  
}

export default TrackManager
