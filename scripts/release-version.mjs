#!/usr/bin/env node
// noinspection JSCheckFunctionSignatures,JSUnresolvedReference

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

// UPDATE ENV
const ghToken = process.env.GITHUB_TOKEN
assert(typeof ghToken === "string" && ghToken.length > 0, `Invalid GITHUB_TOKEN env variable (${ghToken})`)
//
// process.env.GH_TOKEN = ghToken
// $.env = {
//   ...process.env,
//   GH_TOKEN: ghToken
// }

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
  
  echo`Release Info for ${versionTag}:
  
  ${releaseInfoJsonStr}
  
  Validating isDraft === true`
  assert(releaseInfoJson?.[0]?.isDraft === true, `Release is not marked as a draft (${versionTag})`)
  
  // const releaseInfoOutput = await $`gh api repos/jglanz/irsdk-interop/releases/tags/${versionTag}`,
  //   releaseInfoJson = JSON.parse(releaseInfoOutput.stdout)
  //
  // assert(releaseInfoJson.draft === true, `Release is not marked as a draft (${versionTag})`)
}

async function releaseDraft() {
  echo`Updating Github Release v${pkgVersion} to production channel`
  await $`gh release edit ${versionTag} --draft=false --latest`
}

// TODO: Verify functionality & then remove `rebaseDevelopToMaster`
async function rebaseDevelopToMaster() {
  echo`Starting rebase of 'develop' onto 'master'`

  try {
    echo`Fetching latest JUST-IN-CASE`
    await gitExec`git fetch origin develop`
    await gitExec`git fetch origin master`
    //await gitExec`git checkout origin/develop`
    // echo``
    // await gitExec`git checkout origin/master` // Switch to master branch

    // Rebase develop onto master
    echo`REBASE: Starting`
    await gitExec`git rebase develop`
    echo`REBASE: completed and changes pushed to 'master'`

  } catch (error) {
    const cleanupResult = await $({
      cwd: rootDir,
      nothrow: true
    })`git rebase --abort` // Abort the rebase in case of issues
    if (cleanupResult.exitCode !== 0) {
      echo`ERROR: Failed to cleanup rebase, abort failed`
    }
    fatalError(`Error during rebase: ${error.message}`)
  }
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
  // await rebaseDevelopToMaster()
  await releaseSDK()
  await pushMaster()
  await releaseDraft()
}

releaseVersion()

export {}