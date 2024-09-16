#!/usr/bin/env node

const Path = require("path")
const Fs = require("fs")
const { echo, exec } = require("shelljs")

function runPlopAsSideEffect() {
  process.argv.unshift("--force")
  const
    { run } = require("plop"),
    destBasePath = Path.resolve(__dirname, "..")

  run({
    require: require,
    configPath: Path.resolve(__dirname, "plopfile.js"),
    cwd: destBasePath,
    configBase: destBasePath,
  }, null, false)
  //["--plopfile", "scripts/plopfile.js", "new-package"]

}


const rootDir = Path.resolve(
  __dirname,
  "..",
  "..")
const plopFile = Path.join(rootDir,
  "scripts",
  "plop",
  "plopfile.js"
)

const plopExe = Path.join(rootDir, "node_modules",".bin","plop")

function runPlop(
  template,
  ...args
) {
  echo(`Template: ${template}`)
  const result = exec(
    `${plopExe} --plopfile ${plopFile} ${template} -- ${args.join(" ")}`
  )
  if (result.code !== 0) {
    console.error(`Plop failed: ${result.code}`)
    process.exit(result.code)
  }
}

module.exports = {
  runPlop,
  runPlopAsSideEffect
}
