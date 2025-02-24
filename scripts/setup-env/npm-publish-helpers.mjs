import { asOption } from "@3fv/prelude-ts"
import Fsx from "fs-extra"
import { path as Path } from "zx"
import { getOrCreateLogger } from "./logger-setup.mjs"
import { rootDir } from "./workflow-global.mjs"

const log = getOrCreateLogger(import.meta.filename)

// CHECK IF THIS SCRIPT WAS INVOKED DIRECTLY

const publicPackageFiles = Fsx.globSync(["packages/js/vrkit-{models,plugin-sdk}/package.json"], {
    cwd: rootDir,
    exclude: f => f.includes("node_modules")
  }).map(f => Path.join(rootDir, f)),
  publicPackageDirs = publicPackageFiles.map(f => Path.dirname(f))

/**
 * @typedef {{
 *     name: string
 *     version: string
 *     tag: string
 *     releaseFilename: string
 *     json: Object
 *     file: string
 *     dir: string
 * }} PackagePublishInfo
 */

/**
 * Generates the release asset filename for a given package based on its information.
 *
 * @param {Object} pkgJson - The package information object.
 * @return {string} The generated filename of the release asset.
 */
function getReleaseFilename(pkgJson) {
  return `vrkit-platform-${_.last(pkgJson.name.split("/"))}-v${pkgJson.version}.tgz`
}

/**
 * Get all public package info
 *
 * @returns {{
 *   [name: string]: PackagePublishInfo
 * }}
 */
export function getPackagePublishInfo() {
  return publicPackageFiles
    .map(f =>
      asOption([Fsx.readJSONSync(f), Path.dirname(f)])
        .map(([pkgJson, dir]) => ({
          name: pkgJson.name,
          version: pkgJson.version,
          tag: `v${pkgJson.version}`,
          releaseFilename: getReleaseFilename(pkgJson),
          json: pkgJson,
          file: f,
          dir
        }))
        .get()
    )
    .reduce(
      (map, pkgInfo) => ({
        ...map,
        [pkgInfo.name]: pkgInfo
      }),
      {}
    )
}



