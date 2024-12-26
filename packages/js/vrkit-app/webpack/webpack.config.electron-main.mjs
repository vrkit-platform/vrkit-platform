import Path from "path"
import Sh from "shelljs"
// @ts-ignore
import { defaultWebpackConfig, electronExternals, isDevEnabled, toModulePaths } from "vrkit-builder-tool"
import Webpack from "webpack"

const { __dirname } = toModulePaths(import.meta.url)

const moduleDir = Path.resolve(__dirname, ".."),
  distDir = Path.join(moduleDir, "dist", isDevEnabled ? "dev" : "prod"),
  targetDir = Path.join(distDir, "main"),
  targetLogServerDir = Path.join(distDir, "main-logserver")

Sh.mkdir("-p", targetDir)
Sh.mkdir("-p", targetLogServerDir)

function newMainWebpackConfig() {
  return {
    devtool: "source-map",
    config: {
      externals: [/fast-crc/, electronExternals],
      plugins: [
        new Webpack.DefinePlugin({
          //"process.env.NODE_ENV": JSON.stringify(isDevEnabled ? "development" : "production"),
          //isDev: JSON.stringify(isDevEnabled),
          ...(isDevEnabled && { "process.env.DEV_URI_HTTP": JSON.stringify("http://localhost:1618") })
        })
      ]
    }
  }
}

export default () => {
  return [
    defaultWebpackConfig("electron-main", "electron-main", moduleDir, {
      distDir: targetDir,
      entryFile: "./src/main/entry-main.ts",

      ...newMainWebpackConfig()
    }),
    defaultWebpackConfig("node", "electron-main-logserver", moduleDir, {
      distDir: targetLogServerDir,
      entryFile: "./src/main/entry-main-logserver.ts",

      ...newMainWebpackConfig()
    })
  ]
}
