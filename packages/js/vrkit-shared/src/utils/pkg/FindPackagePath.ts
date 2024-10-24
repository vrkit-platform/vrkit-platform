import Path from "path"
import JSON5 from "json5"
import Fs from "fs-extra"
import type {PackageJson} from "type-fest"
import { getLogger } from "@3fv/logger-proxy"

const log = getLogger(__filename)
export function FindPackagePath(name: string): [path: string, pkgJson:PackageJson] {
  const workingDir = process.cwd(),
      parts = workingDir.split(/\\\//),
      treePaths = Array<string>()

  while (parts.length) {
    const dir = Path.join(...parts),
      file = Path.join(dir, "package.json")

    if (Fs.existsSync(file)) {
      const pkgJson = JSON5.parse(Fs.readFileSync(file, "utf-8")),
      
      isMatch = pkgJson.name === name
      log.info(`Checking ${pkgJson.name} for ${name}`)
      if (isMatch) {
        return [dir, pkgJson]
      }
      
    }

    parts.shift()
  }

  return null
}