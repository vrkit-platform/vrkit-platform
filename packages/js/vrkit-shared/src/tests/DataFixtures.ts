import type {MessageType,IMessageType} from "@protobuf-ts/runtime"
import Path from "path"
import { asOption } from "@3fv/prelude-ts"
import * as Fs from "node:fs"

const IBTFiles = {
  Telemetry: {
    IndyCar: {
      RoadAmerica: "data/ibt/telemetry/indy_roadamerica.ibt"
    }
  },
  
}

const LapTrajectoryFiles = {
  RoadAmerica: "data/lap-trajectory/18__roadamerica_full__Full_Course.trackmap"
}

function splitFileParts(path: string) {
  return path.split(/[\/\\]/g)
}

const dirParts = splitFileParts(__dirname)
const fileParts = splitFileParts(IBTFiles.Telemetry.IndyCar.RoadAmerica)

let baseDir = null

while (dirParts.length) {
  const dir = Path.join(...dirParts)
  const testFile = Path.join(dir, ...fileParts)
  // console.log("testDir=", dir, "dirParts", dirParts, "fileParts", fileParts)
  if (Fs.existsSync(testFile)) {
    baseDir = dir
    break;
  }
  
  dirParts.length -= 1
}

if (!baseDir || !Fs.existsSync(baseDir))
  throw Error(`Unable to resolve base dir: ${__dirname}`)


/**
 * Read contents of file and decode message
 *
 * @param filePath
 * @param messageType
 */
export async function readMessage<
    M extends object,
    MT extends MessageType<M> = MessageType<M>,
>(filePath: string, messageType: MT): Promise<M> {
  const data = await Fs.promises.readFile(filePath)
  return messageType.fromBinary(data)
}

export namespace Fixtures {
  export const rootDir = baseDir
  
  export const Files = {
    ibt: IBTFiles,
    trajectory: LapTrajectoryFiles,
  }
  
  export function resolveFile(file: string) {
    return asOption(Path.resolve(baseDir, ...splitFileParts(file)))
        .filter(Fs.existsSync)
        .getOrThrow(`Unable to resolve file "${file}"`)
    
  }
}



export default Fixtures
