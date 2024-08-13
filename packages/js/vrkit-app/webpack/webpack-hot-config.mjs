#!/usr/bin/env zx
// noinspection JSCheckFunctionSignatures

import { rootDir } from "vrkit-builder-tool"
import {path, fs, argv} from "zx"
import { asOption } from "@3fv/prelude-ts"
import "./script-env.mjs"

import assert from "assert"
// const F = require("lodash/fp")


const configFile = asOption(argv.config)
  .map(path.resolve)
  .filter(fs.existsSync)
  .getOrThrow(
    `Invalid config file specified (${argv.config}).  --config=webpack.config.js is required`
  )

const webpackTargetName = path.basename(path.resolve(path.dirname(configFile), ".."))
const log = (...msgs) => console.log(`(webpack-hot-config) [${webpackTargetName}] > ${msgs.map(o => o.toString()).join(" ")}`)


let args = process.argv.slice(2)
while (args.some(it => /webpack-hot-config/.test(it))) {
  args.shift()
}

const index = args.findIndex(arg =>
  arg.startsWith("--config")
)
if (index > -1) {
  let deleteCount = 1

  asOption(args[index + 1])
    .map(path.resolve)
    .filter(file => file === configFile)
    .tap(() => {
      deleteCount++
    })

  args.splice(index, deleteCount)
}

const webpackExe = which("webpack")?.toString()
const nodemonExe = which("nodemon")?.toString()
assert(fs.existsSync(webpackExe),`Webpack exe not valid (${webpackExe})`)
const mode = "development"
const envVars = [
  `NODE_OPTIONS='--experimental-specifier-resolution=node'`,// --trace-warnings
  `NODE_ENV=${mode}`
]
const webpackArgs = [
  ...args,
  `--mode=${mode}`,
  `--config=${configFile.replaceAll("\\","/")}`
]

const watchTarget = path.dirname(configFile) // === process.cwd() ? configFile : path.dirname(configFile)
log(`watching: ${watchTarget}`)
const cmd = `cross-env ${envVars.join(" ")} ${nodemonExe} --trace-warnings --watch ${watchTarget} "../../../node_modules/webpack-cli/lib/webpack-cli.js" -- ${webpackArgs.join(" ")}`

log(`starting: ${cmd}`)
exec(cmd)
