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

// CHECK IF THIS SCRIPT WAS INVOKED DIRECTLY
const shouldExecute = isMainScript(import.meta.url)

cd(rootDir)

const pkgs = Object.values(getPackagePublishInfo())

echo`Publishing vrkit platform modules & packages: \n${pkgs.map(({name}) => name).join("\n")}`

async function checkVersions() {
  echo`Verifying that version numbers are unique`
  for (const pkg of pkgs) {
    const
      pkgDir = pkg.dir,
      pkgFile = pkg.file,
      pkgJson = pkg.json
    
    echo`Checking ${pkg.name} versions`
    
    const output = await $({
      cwd: pkgDir
    })`npm show ${pkgJson.name} --json`

    echo`Parsing version information (${pkgJson.name}) from registry`
    const activePkgJson = JSON.parse(output.stdout)
    const activePkgVersion = activePkgJson.version
    echo`Checking if the pending version (${pkgJson.version}) is greater-than the current active version (${activePkgVersion})`
    if (!semver.gt(pkgJson.version, activePkgVersion)) {
      echo`WARNING: Pending version (${pkgJson.version}) is NOT greater-than the current active version (${activePkgVersion}), packages will not be published`
      return false
    }

    echo`Pending version (${pkgJson.version}) IS valid (current=${activePkgVersion}), will be published`
  }
  return true
}

export async function releaseSDK() {
  if (!await checkVersions()) {
    fatalError(`Versions already published`)
  }
  
  echo`Publishing packages`
  for (const pkg of pkgs) {
    const
      pkgDir = pkg.dir,
      pkgFile = pkg.file,
      pkgJson = pkg.json
    
    const pkgExec = $({
      cwd: pkgDir
    })
    
    echo`Download ${pkgJson.name} version ${pkgJson.version} > ${pkg.releaseFilename}`
    await pkgExec`gh release download ${pkg.tag} --clobber --output ${pkg.releaseFilename} --pattern '${pkg.releaseFilename}'`
    
    echo`Publishing ${pkgJson.name} version ${pkg.tag} > ${pkg.releaseFilename}`
    await pkgExec`yarn publish ${pkg.releaseFilename} --non-interactive`
  }
}

export default releaseSDK

if (shouldExecute) {
  releaseSDK()
}