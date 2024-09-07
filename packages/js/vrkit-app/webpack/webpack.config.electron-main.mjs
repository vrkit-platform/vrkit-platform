import { asOption } from "@3fv/prelude-ts"
import Path from "path"
// @ts-ignore
import {
  toModulePaths,
  assetsDir,
  pkgVersion,
  HtmlWebpackPlugin,
  defaultWebpackConfig,
  electronExternals,
  webpackDevServerConfig,
  vrkAppSrcDir,
  vrkAppDir
} from "vrkit-builder-tool"
import Sh from "shelljs"
import Webpack from "webpack"
import CopyPlugin from "copy-webpack-plugin"

const { __dirname } = toModulePaths(import.meta.url)

const moduleDir = Path.resolve(__dirname, ".."),
  distDir = Path.join(moduleDir, "dist"),
  targetDir = Path.join(distDir,"main")

Sh.mkdir("-p", targetDir)

export default () => {
  return defaultWebpackConfig("electron-main", "electron-main", moduleDir, {
    distDir: targetDir,
    entryFile: "./src/main/entry-main.ts",
    
    devtool: "source-map",
    config: {
      externals: [
        /fast-crc/,
        electronExternals,
      ],
      plugins: [
        new Webpack.DefinePlugin({
          "process.env.DEV_URI_HTTP": JSON.stringify("http://localhost:1618")
        })
        // new CopyPlugin({
        //   patterns: [
        //     {
        //       from: `${dirs.renderer.dist}/`,
        //       to: rendererTargetDir + "/"
        //     }
        //   ]
        // })
      ]
    }
  })
}
