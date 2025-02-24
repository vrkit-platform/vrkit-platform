#!/usr/bin/env node
import "./prod-env.mjs"
import Path from "path"

import { cd } from "zx"
import packSDK from "./pack-sdk.mjs"

import packageElectronApp from "./packaging/package-electron-app.mjs"
import { getOrCreateLogger } from "./setup-env/logger-setup.mjs"
import { inGithubActions } from "./setup-env/process-helpers.mjs"
import { rootDir } from "./setup-env/workflow-global.mjs"
import startWorkflow from "./setup-env/workflow-runner.mjs"



const log = getOrCreateLogger(import.meta.filename)

cd(rootDir)

const prodFlow = {
  logging: {
    dir: Path.join(rootDir, "logs")
  },
  steps: [
    {
      name: "compile",
      parallel: false,
      tasks: [{ name: "compile", command: ["yarn", ["run", "compile"]] }]
    },
    {
      name: "bundle",
      parallel: true,
      tasks: [
        {
          name: "bundle-plugin-internal",
          command: ["yarn", ["workspace", "vrkit-plugin-internal", "run bundle:watch"]]
        },
        { name: "main", command: ["yarn", ["workspace", "vrkit-app", "run build:prod:main"]] },
        { name: "renderer", command: ["yarn", ["workspace", "vrkit-app", "run build:prod:renderer"]] }
      ]
    },
    {
      name: "package",
      parallel: false,
      tasks: [{ name: "package-electron-app", action: () => packageElectronApp() }]
    },
    inGithubActions() && {
      name: "pack-sdks",
      parallel: false,
      tasks: [{ name: "pack-sdks-task", action: () => packSDK() }]
    }
  ].filter(Boolean)
}

startWorkflow(prodFlow)
  .then(res => {
    log.info(`Successfully built package`, res)
    process.exit(0)
  })
  .catch(err => {
    log.error("Prod build failed", err)
    process.exit(1)
  })
