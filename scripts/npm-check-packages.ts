import {asOption} from "@3fv/prelude-ts"
import {isString} from "@3fv/guard"
import Path from "path"
import Tracer from "tracer"
import Fs from "fs-extra"
import { range } from "lodash"
import npmCheck from "npm-check"

const log = Tracer.colorConsole()

//const scriptsDir = Path.resolve(import.meta.dirname)
const buildDir = Path.resolve(__dirname)
const rootDir = Path.resolve(buildDir, ".."),
    jsDir = Path.join(rootDir,"packages","js"),
    jsAppDir = Path.join(jsDir,"vrkit-app"),
    jsAppSrcDir = Path.join(jsAppDir,"src")

async function run() {
  const result = await npmCheck({
    cwd: jsAppDir
  })
  
  log.info("Check result", result)
}

run()
