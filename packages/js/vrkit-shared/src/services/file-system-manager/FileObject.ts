import { Deferred } from "@3fv/deferred"
import Fs from "node:fs"
import { Bind } from "../../decorators"
import { constants as FsConstants } from "fs"
import { getValue } from "@3fv/guard"
import { getLogger } from "@3fv/logger-proxy"

const log = getLogger(__filename)

export enum FileEncodingType {
  Text = "Text",
  Bytes = "Bytes"
}

export const FileEncodingTypeMap: { [type in FileEncodingType]: BufferEncoding } = {
  [FileEncodingType.Text]: "utf-8",
  [FileEncodingType.Bytes]: "binary"
}
export type FileDataType<EncodingType extends FileEncodingType> = EncodingType extends FileEncodingType.Text
  ? string
  : Uint8Array

export class FileObject {
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
    if (skipCache) {
      this[deferredVar] = null
    }

    if (this[deferredVar]) {
      return this[deferredVar].promise
    }

    const deferred = (this[deferredVar] = new Deferred<DataType>())

    const onError = (msg: string) => {
      deferred.reject(new Error(msg))
      this[deferredVar] = null
      return deferred.promise
    }

    if (!(await this.exists)) {
      return onError(`File does not exist: ${this.filePath}`)
    }

    try {
      if (type === FileEncodingType.Bytes) {
        deferred.resolve((await Fs.promises.readFile(this.filePath)) as any)
      } else {
        const encoding = FileEncodingTypeMap[type] as BufferEncoding
        deferred.resolve((await Fs.promises.readFile(this.filePath, encoding)) as DataType)
      }
      return deferred.promise
    } catch (err) {
      return onError(`Unable to read file data (${this.filePath}): ${err.message}\n ${err.stack}`)
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
      return onError(`Unable to read file data (${this.filePath}): ${err.message}\n ${err.stack}`)
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
        log.error(err)
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
