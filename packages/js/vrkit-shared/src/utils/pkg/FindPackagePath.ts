import Path from "path"
import JSON5 from "json5"
import Fs from "fs-extra"
import type {PackageJson} from "type-fest"
import { getLogger } from "@3fv/logger-proxy"
import { isString } from "@3fv/guard"

const log = getLogger(__filename)

export interface FindPathInTreeConfig {
  dir: string
  type: "file" | "dir" | "either"
}
export function FindPathInTree(leaf: string | string[], options: Partial<FindPathInTreeConfig> = {}): [dir: string, target:string] {
  const 
      config:FindPathInTreeConfig = {
        dir: process.cwd(), 
        type: "either",
        ...options
      },
      targetType = config.type,
      leafs = isString(leaf) ? [leaf] : leaf,
      startDir = config.dir,
      parts = startDir.split(/[\\\/]/)
  
  while (parts.length) {
    const dir = Path.join(...parts),
        target = Path.join(dir, ...leafs)
    
    if (Fs.existsSync(target)) {
      let targetTypeOk = true
      if (targetType !== "either") {
        const stat = Fs.lstatSync(target),
          isDir = stat.isDirectory()

        if ((isDir && targetType !== "dir") || (!isDir && targetType === "dir")) {
          targetTypeOk = false
        }
      }

      if (targetTypeOk) {
        return [dir, target]
        
      }
    }
    
    parts.pop()
  }
  
  return null
}


export function FindPackagePath(name: string): [path: string, pkgJson:PackageJson] {
  const workingDir = process.cwd(),
      parts = workingDir.split(/[\\\/]/),
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

    parts.pop()
  }

  return null
}