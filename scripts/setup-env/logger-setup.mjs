import { isString } from "@3fv/guard"
import { asOption } from "@3fv/prelude-ts"
import Path from "node:path"
import Tracer from "tracer"
import { echo, fs as Fs } from "zx"

const globalLoggerName = "GLOBAL"
const loggers = {}

export function getOrCreateLogger(name, logFile = null) {
  const nameSepExp = /[\\\/]/
  if (nameSepExp.test(name)) {
    name = asOption(name.split(nameSepExp))
      .map(parts => parts.filter(isString))
      .map(parts => parts.pop().replace(/\..*$/g, ""))
      .getOrThrow()
  }
  
  return asOption(loggers[name]).getOrCall(() => {
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
        // if (name === globalLoggerName)
        echo(data.output)

        if (logFile) {
          Fs.appendFile(logFile, data.rawoutput + "\n", err => {
            if (err) throw err
          })
        }
      }
    })

    return loggers[name]
  })
}

export function getLogFile(flow, ...categories) {
  const name = categories.join("-")
  const logDir = flow.logging.dir
  const logFile = Path.join(logDir, `${name}.log`)

  if (!Fs.existsSync(logDir)) Fs.mkdirs(logDir)

  return logFile
}

export function createLogger(flow, ...categories) {
  if (categories.length) {
    const name = categories.join("-")
    const logFile = getLogFile(flow, ...categories)
    return getOrCreateLogger(name, logFile)
  } else {
    return getOrCreateLogger(globalLoggerName)
  }
}
