#!/usr/bin/env node

import { asOption } from "@3fv/prelude-ts"
import {
  $,
  argv,
  fs as Fs,
  path as Path,
  echo,
  useBash,
  usePwsh,
  which
} from "zx"
// import Path from "path"
// import Fs from "fs"
import OS from "os"
import Sh from "shelljs"

$.verbose = true

// class LibraryBuilder {
//     constructor() {
//     }
// }
const osType = OS.type()
const isLinux = /linux/i.test(osType)
const isMac = !isLinux && /darwin/i.test(osType)
const isUnix = isMac || isLinux
const isWin32 = !isUnix && /(window|win32)/i.test(osType)

// CONFIGURE SHELL PROPERLY
asOption(isWin32)
  .filter(it => it === true)
  .match({
    None: () => useBash(),
    Some: () => usePwsh()
  })

const scriptDir = import.meta.dirname
const rootDir = Path.resolve(scriptDir, "..")
const srcDir = Path.join(rootDir, "src")
const libDir = Path.join(rootDir, "lib")

// NOTE: As this module is `esm`, the source is directly used, this should be abstracted
const cjsDir = Path.join(libDir, "cjs")
const mjsDir = Path.join(srcDir,"mjs")

const cjsJsonFile = Path.join(cjsDir, "package.json")
const mjsJsonFile = Path.join(mjsDir, "package.json")

const rawArgv = process.argv.slice(2)

echo(`Working directory '${process.cwd()}'`)
console.log(`process.argv: `, rawArgv)
console.log(`argv: `, argv)

const die = (msg, exitCode = 1, err = null) => {
  if (err) {
    console.error(`ERROR: ${msg ?? err.message ?? err.toString()}`, err)
  } else {
    console.error(`ERROR: ${msg}`)
  }

  process.exit(exitCode)
}

const run = (...args) =>
  $`${args}`.catch(err =>
    die(
      `An error occurred while executing: ${args.join(" ")}: ${err.message}`,
      1,
      err
    )
  )

Sh.mkdir("-p", mjsDir, cjsDir)

const cjsJson = `{
    "type": "commonjs",
    "main": "./index.js",
    "module": "./index.js"
  }`.trim(),
  mjsJson = `{
    "type": "module",
    "main": "./index.js",
    "module": "./index.js"
  }`.trim()

Fs.outputFileSync(cjsJsonFile, cjsJson, { encoding: "utf-8" })
Fs.outputFileSync(mjsJsonFile, mjsJson, { encoding: "utf-8" })

const babelArgs = [
  `--config-file=${rootDir}/.babelrc`,
  mjsDir,
  "-d",
  cjsDir,
  ...rawArgv
]

echo`Building with args: ${babelArgs.join(" ")}`
await run("babel", ...babelArgs)

echo`${libDir} successfully built`
