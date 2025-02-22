#!/usr/bin/env node
// noinspection JSCheckFunctionSignatures

import assert from "assert"
import Fsx from "fs-extra"
import * as semver from "semver"
import { $, cd, echo, path as Path } from "zx"
import releaseSDK from "./release-sdk.mjs"
import { getOrCreateLogger } from "./setup-env/logger-setup.mjs"
import { fatalError, isMainScript } from "./setup-env/process-helpers.mjs"
import { rootDir } from "./setup-env/workflow-global.mjs"

const log = getOrCreateLogger(import.meta.filename)

// CHECK IF THIS SCRIPT WAS INVOKED DIRECTLY
const shouldExecute = isMainScript(import.meta.url)

cd(rootDir)

const pkgFile = Path.join(rootDir, "package.json"),
  pkgDirs = rootDir,
  pkgJson = Fsx.readJSONSync(pkgFile),
  pkgVersion = pkgJson.version,
  versionTag = `v${pkgVersion}`

echo`Releasing VRKit Platform version v${pkgVersion}`

async function checkReleaseDraftValid() {
  echo`Checking Github Draft Release v${pkgVersion} exists`
  const releaseInfoOutput = await $`gh api repos/jglanz/irsdk-interop/releases/tags/${versionTag}`,
    releaseInfoJson = JSON.parse(releaseInfoOutput.stdout)
  
  assert(releaseInfoJson.draft === true, `Release is not marked as a draft (${versionTag})`)
}

async function releaseDraft() {
  echo`Updating Github Release v${pkgVersion} to production channel`
  await $`gh release edit ${versionTag} --draft=false`
}

async function releaseVersion() {
  await checkReleaseDraftValid()
  await releaseSDK()
  await releaseDraft()
}



if (shouldExecute) {
  releaseVersion()
}

export {}