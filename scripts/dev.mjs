#!/usr/bin/env node

import Path from "node:path"
import { cd } from "zx"

import { rootDir } from "./setup-env/workflow-global.mjs"
import startWorkflow from "./setup-env/workflow-runner.mjs"

cd(rootDir)

const devFlow = {
  logging: {
    dir: Path.join(rootDir, "logs"),
  },
  steps: [
    {
      name: "prepare",
      parallel: false,
      tasks: [
        { name: "compile", command: ["yarn",["run", "compile:all"]] }
      ]
    },
    {
      name: "dev",
      parallel: true,
      tasks: [
        { name: "compile", command: ["yarn",["run", "compile:all:watch"]] },
        { name: "bundle-plugin-internal", command: ["yarn", ["workspace", "vrkit-plugin-internal", "run bundle:watch"]]},
        { name: "main", command: ["yarn", ["workspace", "vrkit-app", "run dev:main"]]},
        { name: "renderer", command: ["yarn", ["workspace", "vrkit-app", "run dev:renderer"]]}
      ]
    }
  ]
}


startWorkflow(devFlow)