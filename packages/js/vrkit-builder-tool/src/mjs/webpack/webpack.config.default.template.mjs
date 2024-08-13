import { isString } from "@3fv/guard"

// noinspection JSUnresolvedVariable,JSUnresolvedFunction
import { asOption } from "@3fv/prelude-ts"
import ReactRefreshPlugin from "@pmmmwh/react-refresh-webpack-plugin"
import assert from "assert"
import HtmlWebpackPlugin from "html-webpack-plugin"
import { isEmpty } from "lodash-es"
import Path from "path"
import Sh from "shelljs"
import Webpack from "webpack"
import webpackMerge from "webpack-merge"

import {
  aliasMap,
  electronMainEnvVars,
  electronRendererEnvVars,
  isDevEnabled,
  nodeEnvVars,
  DevTools,
  nodeTypescriptLoader,
  nodeTypescriptTsLoader,
  webTypescriptLoader,
  useCacheLoaderDefault,
  createCacheLoaderConfig
} from "./util/index.mjs"

const TargetTypes = [
  "electron-main",
  "electron-renderer",
  "web",
  "webworker",
  "node"
]
const cwd = process.cwd()

const ignoredWatchPaths = [
  /\.map$/,
  /\.d\.ts$/,
  /dist\//,
  /dist\/.*\.js$/,
  /lib\/.*\.js$/,
  /node_modules/
]

const nodeWebpackHotClient = "webpack/hot/poll?1000"

function hydrateEntryConfig(options) {
  const requiredProps = ["name", "entryFile"]
  requiredProps.forEach(prop => {
    asOption(options[prop])
      .filter(isString)
      .filter(it => !isEmpty(it))
      .getOrThrow(`options must have a valid '${prop}' property`)
  })
  const { entryFile, enableHot, isPreload = false, isNode } = options

  return [
    // IF RUNNING IN NODE ENV (no dev-server), ADD HOT CLIENT
    !isPreload && enableHot && nodeWebpackHotClient,

    // ADD SOURCE MAP SUPPORT FOR GOOD STACK TRACES
    isNode
      ? "source-map-support/register"
      : "source-map-support/browser-source-map-support",

    // ACTUAL ENTRY FILE
    entryFile
  ].filter(Boolean)
}

/**
 * Description
 * @param {"web" | "node" | "electron-main" | "electron-renderer" | "webworker"} target
 * @param {string} name
 * @param {string} projectDir=cwd
 * @param {any} options={}
 * @returns {any}
 */
function defaultWebpackConfig(target, name, projectDir = cwd, options = {}) {
  assert(
    TargetTypes.includes(target),
    `Invalid target type: ${TargetTypes.join(",")}`
  )

  projectDir = projectDir ?? Path.resolve(cwd)

  const {
      config: customConfig = {},
      entryFile = "./src/index.ts",
      context = projectDir
    } = options,
    enableHot = isDevEnabled && !customConfig?.devServer,
    tsConfigFile = Path.join(projectDir, "tsconfig.json"),
    distDir = asOption(options.distDir ?? Path.join(projectDir, "dist"))
      .tap(dir => Sh.mkdir("-p", dir))
      .get(),
    isMain = target === "electron-main",
    isRenderer = target === "electron-renderer",
    isNode = target === "node" || isMain,
    isWeb = isRenderer || ["web", "webworker"].includes(target),
    envVars = isMain
      ? electronMainEnvVars
      : isNode
        ? nodeEnvVars
        : electronRendererEnvVars

  // CREATE CACHE CONFIG
  const cacheLoaderConfig = createCacheLoaderConfig(name),
    perfConfig = [useCacheLoaderDefault && cacheLoaderConfig].filter(Boolean),
    tsLoader = isNode
      ? nodeTypescriptLoader(tsConfigFile, perfConfig) //nodeTypescriptLoader(tsConfigFile, perfConfig) // nodeTypescriptTsLoader(tsConfigFile)
      : webTypescriptLoader(
          tsConfigFile,
          perfConfig,
          null,
          target === "webworker"
        ),
    optimization = {
      minimize: false,
      moduleIds: "named",
      chunkIds: "named",
      mangleExports: false,
      runtimeChunk: true,
      ...(!isNode && {
        mergeDuplicateChunks: true,
        splitChunks: {
          chunks: "all"
          //chunks: "async"
        }
      })
    },
    extraEntries = asOption(options.extraEntries)
      .map(extraEntries =>
        Object.entries(extraEntries).map(([extraName, extraConfig]) => [
          extraName,
          hydrateEntryConfig({
            name: extraName,
            ...extraConfig,
            enableHot,
            isNode
          })
        ])
      )
      .map(extraEntryConfigs => Object.fromEntries(extraEntryConfigs))
      .getOrElse({})

  // WEBPACK TEMPLATE
  const config = {
    context,
    name,
    // NOTE: if `contextIsolation` is disabled, then swap the
    //  target lines below
    // NOTE: `contextIsolation` == false
    // target,
    // NOTE: `contextIsolation` == true
    target: isRenderer ? "web" : target,
    entry: {
      [name]: hydrateEntryConfig({
        name,
        entryFile,
        enableHot,
        isPreload: false,
        isNode
      }),
      ...extraEntries
    },
    externals: [],
    stats: {
      preset: "minimal",
      errorDetails: true,
      errorStack: true,
      loggingTrace: true,
      moduleTrace: true,
      warnings: true
    },
    ignoreWarnings: [{ message: /export .* was not found in/ }],
    watchOptions: {
      poll: 500
      // followSymlinks: true
    },
    optimization,
    module: {
      rules: [
        {
          // We're specifying native_modules in the test because the asset relocator loader generates a
          // "fake" .node file which is really a cjs file.
          test: /out\/.*\.node$/,
          use: "node-loader",
        },
        {
          test: /\.(jsx?|tsx?)$/,
          exclude: /node_modules/,
          enforce: "pre",
          use: [...perfConfig, "source-map-loader"].filter(Boolean)
        },
        tsLoader,
        {
          test: /\.pug?$/,
          exclude: /(node_modules|lib\/)/,
          use: {
            loader: "pug-loader"
          }
        },
        {
          test: /\.html$/,
          loader: "html-loader"
        },
        {
          test: /\.s?css$/,
          use: [
            ...perfConfig,
            {
              loader: "style-loader",
              options: {
                esModule: true
              }
            },
            {
              loader: "css-loader",
              options: {
                modules: {
                  auto: true,
                  namedExport: true,
                  localIdentName: isDevEnabled
                    ? "[name]__[local]"
                    : "[sha256:hash:base64:6]"
                }
              }
            },
            "sass-loader"
          ].filter(Boolean)
        },

        {
          test: /\.(png|jpg|gif|svg|webp|avif)$/,
          type: "asset/resource",
          parser: {
            dataUrlCondition: {
              maxSize: 1024
            }
          }
        }
      ]
    },
    // NODE GLOBAL OBJECT & VARIABLE MAPPING
    node: {
      __filename: true,
      global: !isWeb
    },
    mode: isDevEnabled ? "development" : "production",

    // RESOLVE CONFIGURATION & FALLBACKS FOR BROWSER/WEB
    resolve: {
      // FALLBACKS FOR UNAVAILABLE MODULES (PLATFORM SPECIFIC)
      fallback: {
        stream: false,
        zlib: false,
        path: false,
        fs: false,
        os: false,
        crypto: false
      },

      // EXTENSIONS TO TRY WHEN NOT PROVIDED
      extensions: [".tsx", ".ts", ".js"],

      // NO RESOLVE PLUGINS (COULD INCLUDE TS PATH)
      plugins: [],
      alias: aliasMap,
      ...(customConfig?.resolve ?? {})
    },
    plugins: [
      // DEFINE CONSTANTS MAP FOR VAR REPLACEMENTS
      new Webpack.DefinePlugin({
        ...envVars
      }),

      // HMR WHEN IN DEVELOPMENT & HOT CLIENT NOT PROVIDED (i.e. NodeJS Env)
      enableHot && new Webpack.HotModuleReplacementPlugin(),

      // REACT REFRESH FOR DECORATING REACT WITH HMR
      isDevEnabled &&
        isWeb &&
        target !== "webworker" &&
        new ReactRefreshPlugin(),

      // IGNORE UNRELATED/NEEDED FILES FOR BUILDING
      new Webpack.WatchIgnorePlugin({
        paths: [...ignoredWatchPaths]
      })
      // new DashboardPlugin()
    ].filter(Boolean),

    //"eval-source-map" | "inline-source-map" | "source-map"
    // devtool: isDevEnabled ? "source-map" : "source-map",
    devtool: isDevEnabled
      ? DevTools.evalCheapModuleSourceMap
      : //"eval-cheap-source-map" :
        "inline-source-map",
    output: {
      ...(isWeb
        ? {
            // chunkFormat: "module",
            // scriptType: "module",
            // filename: "[name].[contenthash].js"
            filename: "[name].js"
          }
        : // : isMain ? {
          //   filename: "[name].js",
          //   library: {
          //     type: "commonjs2"
          //   }
          // }
          isRenderer
          ? {
              filename: "[name].js",
              library: {
                type: "umd"
              }
            }
          : {
              filename: "[name].js"
            }),
      devtoolModuleFilenameTemplate: "[absolute-resource-path]",
      path: distDir
    }
  }

  return webpackMerge.merge(config, customConfig)
}

export { defaultWebpackConfig, HtmlWebpackPlugin, ReactRefreshPlugin }
