#!/usr/bin/env node
// noinspection JSCheckFunctionSignatures

import { $, cd, path as Path, echo, argv } from "zx"
import Fsx from "fs-extra"
import { getOrCreateLogger } from "./setup-env/logger-setup.mjs"
import { rootDir } from "./setup-env/workflow-global.mjs"
import * as semver from "semver"
const log = getOrCreateLogger(import.meta.filename)

cd(rootDir)

const
  versionInc = argv["inc"] ?? "patch",
  rootPkgFile = Path.join(rootDir, "package.json"),
  rootPkgJson = Fsx.readJSONSync(rootPkgFile),
  {version: currentVersion} = rootPkgJson,
  newVersion = semver.inc(currentVersion, versionInc),
  pkgFiles = Fsx.globSync(["packages/js/*/package.json"], {
    cwd: rootDir,
    exclude: f => f.includes("node_modules")
  }).map(f => Path.join(rootDir, f))

echo`Updating version (${currentVersion} -> ${newVersion}) for vrkit platform: \n${pkgFiles.join("\n")}`

Array(rootPkgFile, ...pkgFiles).forEach(pkgFile => {
  const pkgJson = Fsx.readJSONSync(pkgFile)
  echo`Processing ${pkgFile} (${pkgJson.version} -> ${newVersion})`
  
  pkgJson.version = newVersion
  
  Object.entries(pkgJson)
    .filter(([k,v]) => k.toLowerCase().includes("depend") && typeof v === "object")
    .forEach(([depsKey,deps]) => {
      Object.keys(deps)
        .filter(dep => /^@?vrkit-/.test(dep))
        .forEach(dep => {
          echo`${pkgFile} >> ${depsKey} >> ${dep} -> ${newVersion}`
          deps[dep] = newVersion
        })
    })
  
  // Fsx.writeJSONSync(pkgFile, pkgJson)
})

