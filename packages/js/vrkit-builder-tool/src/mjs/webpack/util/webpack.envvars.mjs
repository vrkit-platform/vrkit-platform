// noinspection WebpackConfigHighlighting

import { mapValues, toPairs, fromPairs } from "lodash-es"
import Path from "path"
import { isDevEnabled, isElectronPackaged, rootDir } from "./webpack.options.mjs"
import Fsx from "fs-extra"
import dot from "dotenv"

// ENV & APP VARIABLES
const pkgVersion = JSON.stringify(Fsx.readJSONSync(Path.join(rootDir,"package.json")).version)
const envVarsBase = {
  // NOTE: Webpack automatically defines NODE_ENV
  // "process.env.NODE_ENV": JSON.stringify(isDevEnabled ? "development" : "production"),
  isDev: JSON.stringify(isDevEnabled),
  ELECTRON_PACKAGED: isElectronPackaged,
  DEBUG: JSON.stringify(isDevEnabled),
  VERSION: pkgVersion,
  ...dot.config().parsed
}

function stringifyValues(data) {
  return mapValues(data, JSON.stringify)
}

function addProcessEnvKeys(data) {
  return Object.fromEntries(
    Object.entries(data).flatMap(([key, value]) =>
      [
        [key, value],
        !key.startsWith("process.") && [`process.env.${key}`, value]
      ].filter(Boolean)
    )
  )
}

// MAP VARS, DUPLICATING EACH PAIR WITH THE SECOND KEY
// PREFIXED WITH `process.env.`
const envVarPairs = toPairs(envVarsBase).flatMap(([k, v]) =>
  [[k, v], !k.startsWith("process.env") && [`process.env.${k}`, v]].filter(
    Boolean
  )
)

const EnvVars = fromPairs(envVarPairs)

const [nodeEnvVars, electronMainEnvVars, electronRendererEnvVars, webEnvVars] =
  ["node", "electron-main", "electron-renderer", "web"]
    .map(name => [
      name,
      name === "node" || name === "electron-main" ? "node" : name
    ])
    .map(([name, target]) =>
      stringifyValues(
        addProcessEnvKeys({
          ...EnvVars,
          isElectron: /electron/.test(name),
          TARGET_PLATFORM: target
        })
      )
    )
// console.info("nodeEnvVars",nodeEnvVars)
// console.info("webEnvVars",webEnvVars)
export {
  EnvVars,
  webEnvVars,
  nodeEnvVars,
  electronMainEnvVars,
  electronRendererEnvVars
}
