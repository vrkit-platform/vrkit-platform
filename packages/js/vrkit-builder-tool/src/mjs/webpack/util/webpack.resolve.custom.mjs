// noinspection WebpackConfigHighlighting,JSValidateTypes,DuplicatedCode

import { fromPairs, flatten, flow, partialRight } from "lodash-es"
import Path from "path"
import Fs from "fs"
import { getValue } from "@3fv/guard"
import Sh from "shelljs"
import F from "lodash/fp.js"
import { assetsDir, rootDir,pkgsDir,vrkNativeInteropDir } from "./webpack.options.mjs"

const { map } = F

// const resolvePackages = partialRight(, _, "packages")
const toString = s => s.toString()
const isValidPkg = pkgDir =>
  ["package.json", "tsconfig.json"]
    .map(filename => Path.join(pkgDir, filename))
    .every(file => Fs.existsSync(file)) &&
  getValue(() => Fs.statSync(Path.join(pkgDir, "src")).isDirectory(), false)

const resolveMods = dir =>
  Sh.ls(dir)
    .map(toString)
    .map(pkg => Path.join(dir, pkg))
    .filter(isValidPkg)

const pkgFlow = flow(
  map(resolveMods),
  flatten,
  map(pkgDir => {
    const pkgJson = JSON.parse(
      Fs.readFileSync(Path.join(pkgDir, "package.json"), "utf-8")
    )
    //require(Path.join(pkgDir, "package.json"))
    const modName = pkgJson.name
    return [modName, Path.join(pkgDir, "src")]
  }),
  fromPairs
)

const pkgMappings = pkgFlow([pkgsDir])
const pkgSrcDirs = Object.values(pkgMappings)

const aliasMap = {
  assets: assetsDir,
  "vrkit-app-assets": assetsDir,
  "vrkit-native-interop": vrkNativeInteropDir,
  ...pkgMappings,
  ...fromPairs(
    ["react", "react-dom", "@swc", "lodash", "@mui", "bluebird"]
      .map(pkg => [pkg, Path.join(rootDir, "node_modules", pkg)])
      .filter(([_, pkgPath]) => Sh.test("-d", pkgPath))
  )
}
// console.info(`Alias map`, aliasMap)
export { aliasMap, pkgSrcDirs }
