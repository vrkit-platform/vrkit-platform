// noinspection JSUnusedGlobalSymbols

import { cloneDeep } from "lodash-es"
import { isDevEnabled } from "./webpack.options.mjs"
import { pkgSrcDirs } from "./webpack.resolve.custom.mjs"

let preprocessorConfig = null

const swcLoaderConfig = {
  loader: "swc-loader",
  options: {
    jsc: {
      parser: {
        syntax: "typescript",
        tsx: true,
        dynamicImport: true,
        decorators: true
      },

      transform: {
        legacyDecorator: true,
        decoratorMetadata: true,
        // decoratorVersion: "2022-03",
        react: {
          runtime: "automatic",
          development: isDevEnabled,
          refresh: isDevEnabled
        }
      },
      target: "es2022",
      loose: true,
      externalHelpers: true
    }
  }
}

const
  /**
   * SWC loader for node
   *
   * @param tsConfigFile
   * @param perfConfig
   * @returns {{test: RegExp, use: (*|{loader: string, options: {jsc: {transform: {decoratorMetadata: boolean, legacyDecorator: boolean, react: {development: boolean, runtime: string, refresh: boolean}}, parser: {decorators: boolean, tsx: boolean, dynamicImport: boolean, syntax: string}, loose: boolean, externalHelpers: boolean, target: string}}})[], exclude: RegExp}}
   */
  nodeTypescriptLoader = (tsConfigFile, perfConfig) => ({
    test: /.(tsx?|jsx)$/,
    include: pkgSrcDirs,
    use: [...perfConfig, swcLoaderConfig, preprocessorConfig].filter(Boolean),
    exclude: /node_modules/
  }),
  /**
   * Standard `ts-loader` config for node
   *
   * @param tsConfigFile
   * @param perfConfig
   * @returns {{test: RegExp, use: {loader: string, options: {onlyCompileBundledFiles: boolean, experimentalWatchApi: boolean, transpileOnly: boolean, configFile, experimentalFileCaching: boolean, colors: boolean}}[], exclude: RegExp}}
   */
  nodeTypescriptTsLoader = (tsConfigFile, perfConfig) => {
    console.log(`Using include dirs`, pkgSrcDirs)
    return {
    test: /.(tsx?|jsx)$/,
    include: pkgSrcDirs,
    use: [
      ...perfConfig,
      {
        loader: "ts-loader",
        options: {
          transpileOnly: true,
          colors: true,
          onlyCompileBundledFiles: true,
          experimentalFileCaching: false,
          experimentalWatchApi: true,
          configFile: tsConfigFile
        }
      },
      preprocessorConfig
    ].filter(Boolean),
    exclude: /node_modules/
  }},
  /**
   * SWC loader for web
   *
   * @param tsConfigFile
   * @param perfConfig
   * @param swcLoaderOptions?
   * @returns {{test: RegExp, use: any[], exclude: RegExp}}
   *
   */
  webTypescriptLoader = (tsConfigFile, perfConfig, swcLoaderOptions = null, skipReact = false) => {
    const localSwcLoaderConfig = cloneDeep(swcLoaderConfig)
    if (swcLoaderOptions) {
      localSwcLoaderConfig.options = swcLoaderOptions
    }
    if (skipReact) {
      localSwcLoaderConfig.options.jsc.parser.tsx = false
      localSwcLoaderConfig.options.jsc.react = false
    }
    return ({
    test: /.tsx?$/,
    include: pkgSrcDirs,
    exclude: /node_modules/,
    use: [...perfConfig, localSwcLoaderConfig, preprocessorConfig].filter(Boolean)
  })},

  /**
   * Standard `ts-loader` config for web
   *
   * @param tsConfigFile
   * @param perfConfig
   * @returns {{test: RegExp, use: {loader: string, options: {onlyCompileBundledFiles: boolean, experimentalWatchApi: boolean, transpileOnly: boolean, experimentalFileCaching: boolean, compilerOptions: {jsx: string}, colors: boolean}}[], exclude: RegExp}}
   */
  webTypescriptTsLoader = (tsConfigFile, perfConfig) => ({
    test: /.(tsx?)$/,
    include: pkgSrcDirs,
    exclude: /node_modules/,
    use: [
      ...perfConfig,
      {
        loader: "ts-loader",
        options: {
          transpileOnly: true,
          colors: true,
          onlyCompileBundledFiles: true,
          experimentalFileCaching: true,
          experimentalWatchApi: true,
          compilerOptions: {
            jsx: "react"
          }
        }
      },
      preprocessorConfig
    ].filter(Boolean)
  })

export {
  webTypescriptLoader,
  webTypescriptTsLoader,
  nodeTypescriptTsLoader,
  nodeTypescriptLoader
}
