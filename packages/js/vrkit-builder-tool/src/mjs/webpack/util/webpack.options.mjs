// noinspection WebpackConfigHighlighting

import Path from "path";
import Fs from "fs";
import _ from "lodash-es";
import { toModulePaths } from "../../setup-env.mjs"
const { isEmpty } = _
const isOpenapiGenerationEnabled = !isEmpty(process.env["OPENAPI_GENERATE"])
const isDevEnabled = process.env.NODE_ENV !== "production" //true
const isElectronPackaged = process.env.ELECTRON_PACKAGED === "1"
console.log(`isDevEnabled=${isDevEnabled}`)
const dirname = typeof __dirname === "undefined" ?  toModulePaths(import.meta.url).__dirname : __dirname

const builderDir = Path.resolve(dirname, "..", "..", "..", "..")
const rootDir = Path.resolve(builderDir, "..", "..", "..")
const pkgsDir = Path.join(rootDir, "packages", "js")

const vrkSharedDir = Path.join(pkgsDir, "vrkit-shared")
const vrkSharedSrcDir = Path.join(vrkSharedDir, "src")


const vrkNativeInteropDir = Path.join(pkgsDir, "vrkit-native-interop")

const vrkAppDir = Path.join(pkgsDir, "vrkit-app")
const vrkAppSrcDir = Path.join(vrkAppDir, "src")

const assetsDir = Path.join(vrkAppSrcDir, "assets")

const mainDir = Path.join(vrkAppSrcDir, "main")
const rendererDir = Path.join(vrkAppSrcDir, "renderer")
const commonDir = Path.join(vrkAppSrcDir, "common")

const pkg = JSON.parse(Fs.readFileSync(Path.join(rootDir, "package.json"),"utf-8"))
const pkgVersion = pkg.version

//[inline-|hidden-|eval-][nosources-][cheap-[module-]]source-map
const DevTools = {
  eval: "eval",
  evalCheapModuleSourceMap: "eval-cheap-module-source-map",
  evalModuleSourceMap: "eval-module-source-map",
  evalSourceMap: "eval-source-map",
  inlineCheapModuleSourceMap: "inline-cheap-module-source-map",
  inlineModuleSourceMap: "inline-module-source-map",
  inlineSourceMap: "inline-source-map",
  cheapModuleSourceMap: "cheap-module-source-map",
  moduleSourceMap: "module-source-map",
  sourceMap: "source-map",
}

export {
  DevTools,
  isOpenapiGenerationEnabled,
  isDevEnabled,
  isElectronPackaged,
  builderDir,
  rootDir,
  pkgsDir,
  vrkNativeInteropDir,
  vrkSharedDir,
  vrkSharedSrcDir,
  vrkAppDir,
  vrkAppSrcDir,
  rendererDir,
  mainDir,
  commonDir,
  assetsDir,
  pkg,
  pkgVersion

}
