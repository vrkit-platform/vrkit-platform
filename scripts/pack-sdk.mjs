#!/usr/bin/env node
// noinspection JSCheckFunctionSignatures

import Fsx from "fs-extra"
import * as semver from "semver"
import { $, cd, echo, path as Path } from "zx"
import { getOrCreateLogger } from "./setup-env/logger-setup.mjs"
import { getPackagePublishInfo } from "./setup-env/npm-publish-helpers.mjs"
import { fatalError, isMainScript } from "./setup-env/process-helpers.mjs"
import { rootDir } from "./setup-env/workflow-global.mjs"

const log = getOrCreateLogger(import.meta.filename)

cd(rootDir)

const pkgs = Object.values(getPackagePublishInfo())

echo`Packing vrkit platform modules & packages: \n${pkgs.map(({name}) => name).join("\n")}`

export async function packSDK() {
  echo`Packing packages`
  for (const pkg of pkgs) {
    const
      pkgDir = pkg.dir,
      pkgFile = pkg.file,
      pkgJson = pkg.json
    
    const pkgExec = $({
      cwd: pkgDir
    })
    
    echo`Packing ${pkgJson.name} version ${pkg.tag} > ${pkg.releaseFilename}`
    await pkgExec`yarn pack --filename ${pkg.releaseFilename} --non-interactive`
    
    echo`Upload ${pkgJson.name} version ${pkgJson.version} > ${pkg.releaseFilename}`
    await pkgExec`gh release upload ${pkg.tag} ${pkg.releaseFilename} --clobber`
    
  }
}

export default packSDK
