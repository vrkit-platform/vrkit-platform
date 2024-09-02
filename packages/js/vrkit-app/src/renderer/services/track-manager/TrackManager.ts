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
import { FileSystemManager } from "../file-system-manager"
import { FileInfo, LapTrajectory, TrackMapFile } from "vrkit-models"
import Path from "path"
import { Deferred } from "@3fv/deferred"

// noinspection TypeScriptUnresolvedVariable
const log = getLogger(__filename)

// noinspection JSUnusedLocalSymbols
const { debug, trace, info, error, warn } = log

export enum TrackType {
  Road = "Road",
  Oval = "Oval",
  DirtRoad = "DirtRoad",
  DirtOval = "DirtOval"
}

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
    await this.reload(true)
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
  
  private getDataFile() {
    return this.fsManager.getFileData(AppFiles.trackMapListFile)
  }
  
  async rebuildDataFile(): Promise<TrackMapFile[]> {
    
    const dataFile = this.getDataFile()
    const tmDir = AppPaths.trackMapsDir
    const tmFiles = await Fs.promises.readdir(tmDir)
        .then(files => files.filter(f => f.endsWith(".trackmap"))
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
  
  async list(): Promise<TrackMapFile[]> {
    await this.readyDeferred.promise
    await this.reload()
    
    return this.trackFiles ?? []
    
  }
  
  private setTrackMapFiles(tmfs:TrackMapFile[]):void {
    this.trackFiles = tmfs
    this.trackFileMap = tmfs.reduce((map, tmf) => ({
      ...map,
      [tmf.trackLayoutMetadata.id]: tmf
    }), {} as any)
  }
  
  async reload(ignoreCache: boolean = false): Promise<TrackManager> {
    if (!ignoreCache && this.readyDeferred.isFulfilled()) {
      return this
    }
    
    const dataFile = this.getDataFile()
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
}

export default TrackManager
