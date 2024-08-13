// noinspection WebpackConfigHighlighting

import { guard } from "@3fv/guard"
import _ from "lodash-es"
import F from "lodash/fp.js"
import Path from "path"
import {
	isDevEnabled, pkg,
	pkgVersion, rootDir
} from "./webpack.options.mjs"
import { aliasMap } from "./webpack.resolve.custom.mjs"

const { flow, mapValues, toPairs, fromPairs, curry } = _
const { tap, map } = F


const useCacheLoaderDefault = true

const createCacheLoaderConfig = name => {
  const cacheDirectory = flow(tap(guard.lift(dir => mkdir("-p", dir))))(
    Path.resolve(rootDir, ".cache", "v0001", name)
  )

  return {
    loader: "cache-loader",
    options: {
      cacheDirectory
    }
  }
}

export {
	isDevEnabled,

	createCacheLoaderConfig,
	useCacheLoaderDefault,
	rootDir,
	pkg,
	pkgVersion
	// tsConfigPathsPlugin: new TsconfigPathsPlugin({
	//   configFile: Path.join(rootDir, "tsconfig.json"),
	// }),
}

