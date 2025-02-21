#!/usr/bin/env node
// noinspection JSCheckFunctionSignatures

import Fsx from "fs-extra"
import * as semver from "semver"
import { $, cd, echo, path as Path } from "zx"
import { getOrCreateLogger } from "./setup-env/logger-setup.mjs"
import { rootDir } from "./setup-env/workflow-global.mjs"

const log = getOrCreateLogger(import.meta.filename)

cd(rootDir)

const pkgFiles = Fsx.globSync(["packages/js/vrkit-{models,plugin-sdk}/package.json"], {
    cwd: rootDir,
    exclude: f => f.includes("node_modules")
  }).map(f => Path.join(rootDir, f)),
  pkgDirs = pkgFiles.map(f => Path.dirname(f))

echo`Publishing vrkit platform modules & packages: \n${pkgDirs.join("\n")}`

async function checkVersions() {
  echo`Verifying that version numbers are unique`
  for (const pkgDir of pkgDirs) {
    echo`Checking ${pkgDir}`
    const pkgFile = Path.relative(process.cwd(), Path.join(pkgDir, "package.json")),
      pkgJson = Fsx.readJSONSync(pkgFile)

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

if (await checkVersions()) {
  echo`Publishing packages`
  for (const pkgDir of pkgDirs) {
    const pkgFile = Path.relative(process.cwd(), Path.join(pkgDir, "package.json")),
      pkgJson = Fsx.readJSONSync(pkgFile)
    
    echo`Publishing ${pkgJson.name} version ${pkgJson.version}`
    await $({
      cwd: pkgDir
    })`yarn publish --non-interactive`
  }
} else {
  echo`Versions already published, skipping`
}