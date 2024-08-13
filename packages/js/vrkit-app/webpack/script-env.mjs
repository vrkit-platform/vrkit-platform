// import "zx/globals"
import {path as Path, argv} from "zx"
import { asOption } from "@3fv/prelude-ts"
// @ts-ignore
import {
  toModulePaths,
  assetsDir,
  pkgVersion,
  HtmlWebpackPlugin,
  defaultWebpackConfig,
  electronExternals,
  webpackDevServerConfig,
  rootDir,
  vrkAppSrcDir,
  vrkAppDir
} from "vrkit-builder-tool"
import _ from "lodash"

const { identity, negate, isEmpty } = _

/**
 * @type {import("shelljs/make")}
 */
import "shelljs/global.js"

const
  nodeModulesBin = Path.join(rootDir, "node_modules", ".bin") + "/",
  scriptsBin = Path.join(rootDir, "scripts") + "/",
  isNotEmpty = negate(isEmpty),
  nodeOptionsAppender = v => () =>
    asOption(env["NODE_OPTIONS"])
      .filter(isNotEmpty)
      .orElse(() => asOption(""))
      .map(nodeOptions => nodeOptions + ` '${v.replaceAll("'", "\\'")}'`)
      .tap(nodeOptions => {
        env["NODE_OPTIONS"] = nodeOptions
        echo("Set NODE_OPTIONS: " + nodeOptions)
      })
      .get()


// for (const pair of Object.entries(argv)) {
//   match(pair)
//     .with(["trace", true], nodeOptionsAppender("--trace-warnings"))
//     .otherwise(identity)
// }

echo("PATH additions", scriptsBin, nodeModulesBin)

// env.NODE_OPTIONS = nodeOptions + `--trace-warnings`
env["PATH"] =
  [scriptsBin, nodeModulesBin, env["PATH"]].join(Path.delimiter)

export {}
