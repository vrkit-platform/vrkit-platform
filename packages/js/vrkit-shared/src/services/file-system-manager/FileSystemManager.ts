import { getLogger } from "@3fv/logger-proxy"
import type { MessageType } from "@protobuf-ts/runtime"
import { PostConstruct, Singleton } from "@3fv/ditsy"
import { Bind } from "../../decorators/Bind"
import YAML from "yaml"
import Fs from "node:fs"
import EventEmitter3 from "eventemitter3"

import Path from "path"
import { FileInfo, millisToTimestamp } from "@vrkit-platform/models"
import { FileObject } from "./FileObject"
import type { JsonObject } from "type-fest"
import JSON5 from "json5"

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
  [FileSystemEventType.FileChange]: (fileChangedEvents: FileChangedEvent[]) => void
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
  getFileObject(filePath: string): FileObject {
    return new FileObject(filePath)
  }

  /**
   * Read contents of file
   *
   * @param filePath
   */
  readFileBytes(filePath: string): Promise<Uint8Array> {
    return this.getFileObject(filePath).readBytes()
  }
  
  readFileText(filePath: string): Promise<string> {
    return this.getFileObject(filePath).readText()
  }

  /**
   * Read contents of file and decode message
   *
   * @param filePath
   * @param messageType
   */
  async readMessage<M extends object, MT extends MessageType<M> = MessageType<M>>(
    filePath: string,
    messageType: MT
  ): Promise<M> {
    const data = await this.getFileObject(filePath).readBytes()
    return messageType.fromBinary(data)
  }
  
  readJSON<T = JsonObject>(filePath: string): Promise<T> {
    return this.readFileText(filePath).then(data => JSON5.parse(data))
  }
  
  readJSON5<T = JsonObject>(filePath: string): Promise<T> {
    return this.readJSON<T>(filePath)
  }
  
  readYaml<T = JsonObject>(filePath: string): Promise<T> {
    return this.readFileText(filePath).then(data => YAML.parse(data))
  }
}

export default FileSystemManager
