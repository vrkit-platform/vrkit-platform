#!/usr/bin/env node
// noinspection JSCheckFunctionSignatures

import Fsx from "fs-extra"
import * as semver from "semver"
import { $, argv, cd, echo, path as Path } from "zx"
import { getOrCreateLogger } from "./setup-env/logger-setup.mjs"
import { rootDir } from "./setup-env/workflow-global.mjs"

const log = getOrCreateLogger(import.meta.filename)

async function run()
{
  cd(rootDir)
  
  const pkgFiles = Fsx.globSync(["packages/js/vrkit-{models,plugin-sdk}/package.json"], {
    cwd: rootDir, exclude: f => f.includes("node_modules")
  }).map(f => Path.join(rootDir, f)), pkgDirs = pkgFiles.map(f => Path.dirname(f))
  
  for (const pkgDir of pkgDirs) {
    echo`Checking version ${pkgDir}`
    const pkgFile = Path.relative(process.cwd(), Path.join(pkgDir, "package.json")), pkgJson = Fsx.readJSONSync(pkgFile)
    
    const output = await $({
      cwd: pkgDir
    })`npm show ${pkgJson.name} --json`
    
    echo`Parsing version information (${pkgJson.name}) from registry`
    const activePkgJson = JSON.parse(output.stdout)
    const activePkgVersion = activePkgJson.version
    echo`Checking if the pending version (${pkgJson.version}) is greater-than the current active version (${activePkgVersion})`
    if (!semver.gt(pkgJson.version, activePkgVersion)) {
      process.stderr.write(`ERROR: Pending version (${pkgJson.version}) is NOT greater-than the current active version (${activePkgVersion})\n`)
      process.exit(1)
      return
    }
    
    echo`Pending version (${pkgJson.version}) IS valid (current=${activePkgVersion}), will be published`
  
  }
}

await run()