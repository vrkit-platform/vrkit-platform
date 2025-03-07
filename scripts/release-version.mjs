#!/usr/bin/env node
// noinspection JSCheckFunctionSignatures,JSUnresolvedReference

import assert from "assert"
import Fsx from "fs-extra"
import { $, cd, echo, path as Path } from "zx"
import releaseSDK from "./release-sdk.mjs"
import { getOrCreateLogger } from "./setup-env/logger-setup.mjs"
import { fatalError } from "./setup-env/process-helpers.mjs"
import { rootDir } from "./setup-env/workflow-global.mjs"

const log = getOrCreateLogger(import.meta.filename)

cd(rootDir)

const pkgFile = Path.join(rootDir, "package.json"),
  pkgDirs = rootDir,
  pkgJson = Fsx.readJSONSync(pkgFile),
  pkgVersion = pkgJson.version,
  versionTag = `v${pkgVersion}`

const gitExec = $({
  cwd: rootDir
})

echo`VRKit Platform version v${pkgVersion} - Releasing`

async function checkReleaseDraftValid() {
  echo`Checking Github Draft Release v${pkgVersion} exists`
  const releaseInfoOutput = await $`gh release list --json "name,isDraft,tagName" -q '[.[] | select(.name == "${pkgVersion}")]'`,
    releaseInfoJsonStr = releaseInfoOutput.stdout,
    releaseInfoJson = JSON.parse(releaseInfoJsonStr)
  
  echo`Release Info for ${versionTag}:\n${releaseInfoJsonStr}`
  
  assert(releaseInfoJson?.[0]?.isDraft === true, `Release is not marked as a draft (${versionTag})`)
}

async function releaseDraft() {
  echo`Updating Github Release v${pkgVersion} to production channel`
  await $`gh release edit ${versionTag} --draft=false --latest`
}

async function pushMaster() {
  try {
    // Push the changes to master (with --force due to rebase)
    await gitExec`git push --force`
  } catch (error) {
    fatalError(`Error during push: ${error.message}`)
  }
}

async function releaseVersion() {
  await checkReleaseDraftValid()
  await releaseSDK()
  await pushMaster()
  await releaseDraft()
}

releaseVersion()
  .catch(err => {
    console.error(`Error occurred: ${err?.message}`, err)
    fatalError(err.message)
  })

