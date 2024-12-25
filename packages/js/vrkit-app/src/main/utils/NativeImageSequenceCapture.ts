import { NativeImage } from "electron"
import * as Fs from "fs"
import * as Path from "path"
// import * as os from 'os';
import { getLogger } from "@3fv/logger-proxy"
import PQueue from "p-queue"
import * as OS from "node:os"
import { Identity, isNotEmpty } from "@vrkit-platform/shared"
import { asOption } from "@3fv/prelude-ts"
import { NativeImageSeqSettings, NativeImageSequenceFormat, NativeImageSequenceFormats } from "@vrkit-platform/shared"

const log = getLogger(__filename)


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
      const size = image.getSize(),
          file = Path.join(
              this.tempDir,
              `${this.name}-${size.width}x${size.height}-${idx.toString().padStart(3,'0')}.${this.format}`
          ),
          buf = this.format === "png" ? image.toPNG() : image.getBitmap()
      
      await Fs.promises.writeFile(file, buf)
      log.info(`Wrote ${file}`)
    })
  }
  
  
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