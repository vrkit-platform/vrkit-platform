import { rimrafSync } from "rimraf"
import fs from "fs"
import webpackPaths from "../configs/webpack.paths"

const foldersToRemove = [
  webpackPaths.distPath, webpackPaths.buildPath, webpackPaths.dllPath
]

export default function cleanBuild() {
  foldersToRemove.forEach((folder) => {
    if (fs.existsSync(folder)) rimrafSync(folder)
  })
}
