import Path from "path"
const rootPath = Path.join(__dirname, "../../..")

const buildBasePath = Path.join(rootPath, "build","js")
const buildPath = Path.join(buildBasePath, "vrkit-dist")

const dllPath = Path.join(buildBasePath,"vrkit-externals-dll")

const jsPkgPath = Path.join(rootPath, "packages", "js")
const appPath = Path.join(jsPkgPath, "vrkit-app")

const srcPath = Path.join(appPath, "src")
const srcMainPath = Path.join(srcPath, "main")
const srcRendererPath = Path.join(srcPath, "renderer")



const appPackagePath = Path.join(appPath, "package.json")
const appNodeModulesPath = Path.join(appPath, "node_modules")
const srcNodeModulesPath = Path.join(srcPath, "node_modules")

const distPath = Path.join(buildBasePath, "vrkit-dist")
const distMainPath = Path.join(distPath, "main")
const distRendererPath = Path.join(distPath, "renderer")



export default {
  rootPath,
  dllPath,
  srcPath,
  srcMainPath,
  srcRendererPath,
  appPath,
  appPackagePath,
  appNodeModulesPath,
  srcNodeModulesPath,
  distPath,
  distMainPath,
  distRendererPath,
  buildPath,
  buildBasePath
}
