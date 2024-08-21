#!/usr/bin/env node

import { Deferred } from "@3fv/deferred"
import { asOption } from "@3fv/prelude-ts"
import { spawn } from "node:child_process"
import { match } from "ts-pattern"
import {$, cd, path as Path, fs as Fs, echo, within, usePwsh} from "zx"
import Tracer from "tracer"

if (process.platform === "win32") {
  usePwsh()
}

const scriptsDir = Path.resolve(import.meta.dirname)
const rootDir = Path.dirname(scriptsDir)
const nodeModulesBin = Path.join(rootDir, "node_modules", ".bin")

if (Fs.existsSync(nodeModulesBin)) {
  process.env.PATH = `${nodeModulesBin}${Path.sep}${process.env.PATH}`
}

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
        { name: "main", command: ["yarn", ["workspace", "vrkit-app", "run dev:main"]]},
        { name: "renderer", command: ["yarn", ["workspace", "vrkit-app", "run dev:renderer"]]}
      ]
    }
  ]
}

// TODO: Make the following a standalone package/tool

const globalLoggerName = "GLOBAL"

const loggers = {},
  pendingProcs = []

let signalled = false;

const cleanupProcs = (sig = "SIGKILL") => () => {
  if (signalled) {
    console.warn(`Already cleaning up, ignoring ${sig}`)
    return
  }
  
  signalled = true
  for (const proc of pendingProcs) {
    if (!proc.killed) {
      console.info(`Killing PID: ${proc.pid}`)
      try {
        proc.kill()
      } catch (err) {
        console.error(`unable to kill ${proc.pid}`,err)
      }
    }
  }
  process.exit(1)
}



for (const sig of ['SIGTERM', "SIGINT", "SIGKILL"]) {
  process.on(sig, cleanupProcs(sig))
}

function getOrCreateLogger(name, logFile = null) {
  return asOption(loggers[name])
    .getOrCall(() => {
      const category = name.toUpperCase()
      loggers[name] = Tracer.console({
        format: [
          '{{timestamp}} <{{category}}> {{message}}', //default format
          {
            error:
              '{{timestamp}} <{{category}}> {{message}} (in {{file}}:{{line}})\nCall Stack:\n{{stack}}' // error format
          }
        ],
        dateformat: 'HH:MM:ss.L',
        preprocess: function(data) {
          data.category = category
        },
        transport: function(data) {
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

function createLogger(flow, ...categories) {
  if (categories.length) {
    const name = categories.join("-")
    const logDir = flow.logging.dir
    if (!Fs.existsSync(logDir))
      Fs.mkdirs(logDir)
    
    const logFile = Path.join(logDir, `${name}.log`)
    return getOrCreateLogger(name, logFile)
  } else {
    return getOrCreateLogger(globalLoggerName)
  }
}

async function runTask(task, step, flow) {
  const logger = createLogger(flow, step.name, task.name)
  const prefix = `STEP(${step.name}) > TASK(${task.name}):`
  const [cmd, args] = task.command
  
  try {
    const deferred = new Deferred()
    
    const taskProc = spawn(cmd, args, {
      env: process.env,
      shell: true,
      detached: false
    });
    
    pendingProcs.push(taskProc)
    
    taskProc.stdout.on('data', (data) => {
      logger.info(`${data}`);
    });
    
    taskProc.stderr.on('data', (data) => {
      logger.info(`${data}`);
    });
    
    taskProc.on('close', (code) => {
      const msg = `child process close all stdio with code ${code}`
      if (code === 0)
        logger.info(msg);
      else
        logger.error(msg);
      
      if (!deferred.isSettled()) {
        if (code === 0)
          deferred.resolve(code)
        else
          deferred.reject(new Error(msg))
      }
    });
    
    taskProc.on('exit', (code) => {
      const msg = `child process exited all stdio with code ${code}`
      if (code === 0)
        logger.info(msg);
      else
        logger.error(msg);
      
      
      if (!deferred.isSettled()) {
        if (code === 0)
          deferred.resolve(code)
        else
          deferred.reject(new Error(msg))
      }
    });
    
    
    await deferred.promise
    logger.info(`${prefix} Success`)
  } catch (err) {
    logger.error(`STEP(${step.name}): Failed`, err)
    throw err
  }
}

async function runStep(step, flow) {
  /*
  {
      name: "prepare",
      parallel: false,
      tasks: [
        { name: "compile", command: `yarn run compile:all` }
      ]
    },
   */
  const log = createLogger(flow, step.name)
  log.info(`STEP(${step.name}): Starting`)
  try {
    const isParallel = step.parallel === true
    if (isParallel) {
      await Promise.all(step.tasks.map(task => runTask(task, step, flow)))
    } else {
      for await (const task of step.tasks) {
        await runTask(task, step, flow)
      }
    }
    log.info(`STEP(${step.name}): Success`)
  } catch (err) {
    log.error(`STEP(${step.name}): Failed`, err)
    throw err
  }
}


async function runFlow(flow) {
  const log = createLogger(flow)
  log.info("Starting")
  try {
    for await (const step of flow.steps) {
      await runStep(step, flow)
    }
  } catch (err) {
    log.error(`Failed`, err)
    // process.exit(1)
  }
  
  cleanupProcs("SIGKILL")()
}


await runFlow(devFlow)

