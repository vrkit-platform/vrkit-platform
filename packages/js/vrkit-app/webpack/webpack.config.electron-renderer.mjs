import { asOption } from "@3fv/prelude-ts"
import Path from "path"

// @ts-ignore
import {
  toModulePaths,
  pkgVersion,
  HtmlWebpackPlugin,
  defaultWebpackConfig,
  electronExternals,
  webpackDevServerConfig,
  assetsDir,
  rendererDir,
  vrkAppSrcDir,
  vrkAppDir
} from "vrkit-builder-tool"
import Sh from "shelljs"
import Webpack from "webpack"
import CopyPlugin from "copy-webpack-plugin"

const { __dirname } = toModulePaths(import.meta.url)

const moduleDir = Path.resolve(__dirname, ".."),
  distDir = Path.join(moduleDir, "dist"),
  targetDir = Path.join(distDir,"renderer")

Sh.mkdir("-p", targetDir)

const
  devServer = webpackDevServerConfig(1618, {
    static: [distDir, targetDir, assetsDir, Path.dirname(assetsDir)],
    proxy: [{
      context: ['/api','/public'],
      // target: "http://localhost:7001"
      target: "http://localhost:7272"
      
    }]
  })

const webConfig = defaultWebpackConfig("electron-renderer", "electron-renderer", moduleDir, {
  distDir: targetDir,
  entryFile: "./src/renderer/entry/default/entry-renderer.tsx",
  extraEntries: {
    "electron-renderer-overlay": {
      entryFile: "./src/renderer/entry/overlay/entry-renderer-overlay.tsx"
    }
  },
  config: {
    externals: [electronExternals],
    devServer,
    plugins: [
      new HtmlWebpackPlugin({
        title: "vrkit-electron-renderer",
        filename: `index.html`,
        excludeChunks: ["electron-renderer-overlay"],
        template: Path.join(rendererDir, "entry/default/entry-renderer.ejs"),
        templateParameters: {
          isElectron: true,
          appVersion: pkgVersion,
          appPathPrefix: ""
        }
      }),
      new HtmlWebpackPlugin({
        title: "vrkit-electron-renderer-overlay",
        filename: `index-overlay.html`,
        excludeChunks: ["electron-renderer"],
        template: Path.join(rendererDir, "entry/overlay/entry-renderer-overlay.ejs"),
        templateParameters: {
          isElectron: true,
          appVersion: pkgVersion,
          appPathPrefix: ""
        }
      })
    ]
  }
})

export default () => [
  webConfig
]
