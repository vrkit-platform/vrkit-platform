import Path from "path"
import { asOption } from "@3fv/prelude-ts"
import * as Fs from "node:fs"

const IBTFiles = {
  IndyCar: {
    RoadAmerica: "data/ibt/indy_roadamerica.ibt"
  }
}

function splitFileParts(path: string) {
  return path.split(/[\/\\]/g)
}

const dirParts = splitFileParts(__dirname)
const fileParts = splitFileParts(IBTFiles.IndyCar.RoadAmerica)

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


export namespace Fixtures {
  export const rootDir = baseDir
  
  export const Files = {
    ibt: IBTFiles
  }
  
  export function resolveFile(file: string) {
    return asOption(Path.resolve(baseDir, ...splitFileParts(file)))
        .filter(Fs.existsSync)
        .getOrThrow(`Unable to resolve file "${file}"`)
    
  }
}

export default Fixtures
