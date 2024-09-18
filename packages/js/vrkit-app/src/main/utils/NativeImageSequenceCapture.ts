import { NativeImage } from "electron"
import * as Fs from "fs"
import * as Path from "path"
// import * as os from 'os';
import { getLogger } from "@3fv/logger-proxy"
import PQueue from "p-queue"
import * as OS from "node:os"

const log = getLogger(__filename)

export type NativeImageSequenceFormat = "raw" | "png"

export class NativeImageSequenceCapture {
  private readonly queue = new PQueue({
    concurrency: 1
  })
  
  private counter = 0
  
  readonly tempDir: string

  constructor(
    readonly name: string,
    readonly format: NativeImageSequenceFormat
  ) {
    this.tempDir = Path.join(OS.tmpdir(), name)
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
