import { NativeImage } from "electron"
import * as Fs from "fs"
import * as Path from "path"
// import * as os from 'os';
import { getLogger } from "@3fv/logger-proxy"
import PQueue from "p-queue"
import * as OS from "node:os"
import { Identity, isNotEmpty } from "vrkit-app-common/utils"
import { asOption } from "@3fv/prelude-ts"

const log = getLogger(__filename)

export type NativeImageSequenceFormat = "raw" | "png"

export const NativeImageSequenceFormats:NativeImageSequenceFormat[] = ["raw", "png"]

export class NativeImageSequenceCapture {
  private readonly queue = new PQueue({
    concurrency: 1
  })
  
  private counter = 0
  
  readonly tempDir: string
  
  constructor(
    readonly name: string,
    readonly format: NativeImageSequenceFormat,
      tempDir: string = null
  ) {
    
    this.tempDir = asOption(tempDir)
        .filter(isNotEmpty)
        .match({Some: Identity, None: () => Path.join(OS.tmpdir(), name)})
    
    log.info(`Temp dir`, this.tempDir)
    
    if (!Fs.existsSync(this.tempDir)) {
      Fs.mkdirSync(this.tempDir)
    }
  }
  
  push(image: NativeImage) {
    const idx = ++this.counter
    
    this.queue.add(async () => {
      const file = Path.join(this.tempDir, `${this.name}-${idx.toString().padStart(3,'0')}.${this.format}`)
      const buf = this.format === "png" ? image.toPNG() : image.getBitmap()
      await Fs.promises.writeFile(file, buf)
      log.info(`Wrote ${file}`)
    })
  }
  
  
}

export type NativeImageSeqSettings = false | {
  format: NativeImageSequenceFormat
  outputPath?: string
  
}


export function newNativeImageSequenceCaptureSettings():NativeImageSeqSettings {
  return asOption(process.env.NATIVE_IMAGE_SEQ).match({
    Some: (settingStr: string): NativeImageSeqSettings => {
      const [formatStr, pathStr] = settingStr.split(/[,;]/)
      const format = asOption(formatStr?.toLowerCase() as NativeImageSequenceFormat)
          .filter(format => NativeImageSequenceFormats.includes(format))
          .match({
            None: () => "raw",
            Some: Identity
          }) as NativeImageSequenceFormat
      return {
        format,
        outputPath: asOption(pathStr)
            .filter(isNotEmpty)
            .match({
              Some: Identity,
              None: () => null
            })
      }
    },
    None: (): NativeImageSeqSettings => false
  })
}