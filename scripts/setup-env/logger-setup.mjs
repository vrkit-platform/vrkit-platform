import { isString } from "@3fv/guard"
import { asOption } from "@3fv/prelude-ts"
import assert from "assert"
import _ from "lodash"
import Path from "path"
import Tracer from "tracer"
import { echo, fs as Fs } from "zx"

const {memoize} = _

const globalLoggerName = "GLOBAL"
const loggers = {}
let gLogFile = null
let gLogFileHandle = null

function closeLogFile() {
  if (gLogFileHandle) {
    Fs.closeSync(gLogFileHandle.fd)
    gLogFileHandle = null
    gLogFile = null
  }
}

process.once("beforeExit", closeLogFile)

export async function setLogFile(flow, envName = process.env.NODE_ENV === "production" ? "prod" : "dev") {
  const logDir = flow?.logging?.dir
  assert(logDir?.length > 0, "getLogFile requires a flow object")
  
  const name = `build-${envName}.log`
  
  closeLogFile()
  
  const logFile = Path.join(logDir, `${name}.log`)
  if (!Fs.existsSync(logDir)) Fs.mkdirsSync(logDir)
  
  gLogFileHandle =  await Fs.promises.open(logFile)
  gLogFile = logFile
  
  return gLogFile
}

const newLogger = memoize((name) => {
  if (loggers[name])
    return loggers[name]
  
  const category = name.toUpperCase()
  loggers[name] = Tracer.console({
    format: [
      "{{timestamp}} <{{category}}> {{message}}", //default format
      {
        error: "{{timestamp}} <{{category}}> {{message}} (in {{file}}:{{line}})\nCall Stack:\n{{stack}}" // error format
      }
    ],
    dateformat: "HH:MM:ss.L",
    preprocess: function (data) {
      data.category = category
    },
    transport: function (data) {
      echo(data.output)
      if (gLogFileHandle) {
        gLogFileHandle.appendFile(data.rawoutput + "\n").catch(err => {
          console.error(`Failed to append file ${gLogFile}`)
          if (err) throw err
        })
      }
    }
  })
  
  return loggers[name]
})

export function getOrCreateLogger(name, ...categories) {
  if (!name || !isString(name))
    name = globalLoggerName
  
  const nameSepExp = /[\\\/]/
  if (nameSepExp.test(name)) {
    name = asOption(name.split(nameSepExp))
      .map(parts => parts.filter(isString))
      .map(parts => parts.pop().replace(/\..*$/g, ""))
      .getOrThrow()
  }
  
  if (categories.length) {
    name = `${name}-${categories.join("-")}`
  }
  
  return newLogger(name)
}


