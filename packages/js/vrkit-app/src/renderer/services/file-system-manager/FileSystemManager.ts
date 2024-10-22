import { getLogger } from "@3fv/logger-proxy"
import type {MessageType,IMessageType} from "@protobuf-ts/runtime"
import { Inject, PostConstruct, Singleton } from "@3fv/ditsy"
import { Bind } from "vrkit-shared"
import { isDev } from "../../renderer-constants"
import { getValue } from "@3fv/guard"
import Fs, { constants as FsConstants } from "node:fs"
import EventEmitter3 from "eventemitter3"
import { Deferred } from "@3fv/deferred"

import Path from "path"
import { FileInfo, millisToTimestamp } from "vrkit-models"

// noinspection TypeScriptUnresolvedVariable
const log = getLogger(__filename)

// noinspection JSUnusedLocalSymbols
const { debug, trace, info, error, warn } = log

export enum FileChangeType {
  Add = "Add",
  Remove = "Remove",
  Change = "Change"
}

export enum FileSystemEventType {
  FileChange = "FileChange"
}

export interface FileChangedEvent {
  changeType: FileChangeType

  paths: string[]
}

export interface FileSystemManagerEventArgs {
  [FileSystemEventType.FileChange]: (
    fileChangedEvents: FileChangedEvent[]
  ) => void
}

export enum FileEncodingType {
  Text = "Text", 
  Bytes = "Bytes",
} 

export const FileEncodingTypeMap: {[type in FileEncodingType]: BufferEncoding} = {
  [FileEncodingType.Text]: "utf-8",
  [FileEncodingType.Bytes]: "binary",
}

export type FileDataType<EncodingType extends FileEncodingType> = EncodingType extends FileEncodingType.Text ? string : Uint8Array

export class FileAccess {
  /**
   * Reference to a pending or successful `readData()` promise
   *
   * @private
   */
  private bytesDeferred: Deferred<Uint8Array> = null
  private textDeferred: Deferred<string> = null

  private async readInternal<
    EncodingType extends FileEncodingType,
    DataType extends FileDataType<EncodingType> = FileDataType<EncodingType>
  >(type: EncodingType, skipCache: boolean = false): Promise<DataType> {
    const deferredVar = `${type.toLowerCase()}Deferred`
    if (skipCache) this[deferredVar] = null

    if (this[deferredVar]) return this[deferredVar].promise

    const deferred = (this[deferredVar] = new Deferred<DataType>())

    const onError = (msg: string) => {
      deferred.reject(new Error(msg))
      this[deferredVar] = null
      return deferred.promise
    }

    if (!(await this.exists))
      return onError(`File does not exist: ${this.filePath}`)

    try {
      if (type === FileEncodingType.Bytes) {
        deferred.resolve(
            await Fs.promises.readFile(this.filePath) as any
        )
      } else {
        const encoding = FileEncodingTypeMap[type] as BufferEncoding
        deferred.resolve((
            await Fs.promises.readFile(this.filePath, encoding)
        ) as DataType)
      }
      return deferred.promise
    } catch (err) {
      return onError(
        `Unable to read file data (${this.filePath}): ${err.message}\n ${err.stack}`
      )
    }
  }

  private async writeInternal<
    EncodingType extends FileEncodingType,
    DataType extends FileDataType<EncodingType> = FileDataType<EncodingType>
  >(type: EncodingType, data: DataType): Promise<void> {
    const onError = (msg: string) => {
      throw new Error(msg)
    }

    try {
      const encoding = FileEncodingTypeMap[type] as BufferEncoding
      await Fs.promises.writeFile(this.filePath, data, encoding)
    } catch (err) {
      return onError(
        `Unable to read file data (${this.filePath}): ${err.message}\n ${err.stack}`
      )
    }
  }

  @Bind
  clearTextCache() {
    this.textDeferred = null
  }

  @Bind
  clearBytesCache() {
    this.bytesDeferred = null
  }

  @Bind
  clearCache() {
    this.clearTextCache()
    this.clearBytesCache()
  }

  async writeText(data: string): Promise<void> {
    try {
      await this.writeInternal(FileEncodingType.Text, data)
    } finally {
      this.clearCache()
    }
  }

  async writeBytes(data: Uint8Array): Promise<void> {
    try {
      await this.writeInternal(FileEncodingType.Bytes, data)
    } finally {
      this.clearCache()
    }
  }

  readText(skipCache: boolean = false): Promise<string> {
    return this.readInternal(FileEncodingType.Text, skipCache)
  }

  /**
   * Read file data & if successful, cache the `Deferred` instance
   * to avoid re-reading a file
   */
  readBytes(skipCache: boolean = false): Promise<Uint8Array> {
    return this.readInternal(FileEncodingType.Bytes, skipCache)
  }

  /**
   * Retrieve a cached bytes reference via the deferred promise used
   * or attempt `readData()`
   */
  get data(): Promise<Uint8Array> {
    return this.readBytes()
  }

  get text(): Promise<string> {
    return this.readText()
  }
 

  /**
   * Async file exists check
   */
  get exists(): Promise<boolean> {
    return Fs.promises
      .access(this.filePath, FsConstants.F_OK)
      .then(() => true)
      .catch(err => {
        error(err)
        return false
      })
  }

  /**
   * Sync exists call (basically `fs.existsSync`)
   */
  get existSync(): boolean {
    return getValue(() => {
      Fs.accessSync(this.filePath, FsConstants.F_OK)
      return true
    }, false)
  }

  constructor(
    readonly filePath: string,
    readonly disableCache: boolean = false
  ) {}
}



@Singleton()
export class FileSystemManager extends EventEmitter3<FileSystemManagerEventArgs> {
  
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
        fileSystemManager: this
      })
    }

    if (typeof window !== "undefined") {
      window.addEventListener("beforeunload", this.unload)
    }
  }

  /**
   * Service constructor
   *
   */
  constructor() {
    super()
  }
  
  async getFileInfo(filePath: string) {
    const stats = await Fs.promises.lstat(filePath)
    
    return FileInfo.create({
      file: filePath,
      filename: Path.basename(filePath),
      createdAt: millisToTimestamp(BigInt(Math.floor(stats.ctimeMs))),
      modifiedAt: millisToTimestamp(BigInt(Math.floor(stats.mtimeMs))),
      isDeleted: false,
      parentDir: Path.dirname(filePath)
    })
  }
  
  /**
   * Get `FileData` wrapper
   *
   * @param filePath
   */
  getFileAccess(filePath: string): FileAccess {
    return new FileAccess(filePath)
  }
  
  /**
   * Read contents of file
   *
   * @param filePath
   */
  readFile(filePath: string): Promise<Uint8Array> {
    return this.getFileAccess(filePath).readBytes();
    
  }
  
  /**
   * Read contents of file and decode message
   *
   * @param filePath
   * @param messageType
   */
  async readMessage<
      M extends object,
      MT extends MessageType<M> = MessageType<M>,
  >(filePath: string, messageType: MT): Promise<M> {
    const data = await this.getFileAccess(filePath).readBytes();
    return messageType.fromBinary(data)
  }
  
  
}

export default FileSystemManager
