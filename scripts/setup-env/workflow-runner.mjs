import { Deferred } from "@3fv/deferred"
import { guard } from "@3fv/guard"
import { spawn } from "child_process"

import killAll from "tree-kill"
import { createLogger } from "./logger-setup.mjs"

const pendingProcs = []

let signalled = false

const cleanupProcs = (sig = "SIGKILL") => () => {
  if (signalled) {
    console.warn(`Already cleaning up, ignoring ${sig}`)
    return
  }
  
  signalled = true
  for (const proc of pendingProcs) {
    
    if (proc.pid > 0 && !proc.killed) {
      console.info(`Killing PID: ${proc.pid}`)
      try {
        const pid = proc.pid
        guard(() => killAll(pid, "SIGKILL"))
      } catch (err) {
        console.error(`unable to kill ${proc.pid}`, err)
      }
    }
  }
  guard(() => killAll(process.pid, "SIGKILL"))
}

for (const sig of ["SIGTERM", "SIGINT", "SIGKILL"]) {
  process.on(sig, cleanupProcs(sig))
}

async function runTask(task, step, flow, logger) {
  const prefix = `STEP(${step.name}) > TASK(${task.name}):`
  if (Array.isArray(task.command) && task.command.length) {
    const [cmd, args] = task.command
    
    try {
      const deferred = new Deferred()
      
      const taskProc = spawn(cmd, args, {
        env: process.env, shell: true, stdio: ["inherit", "inherit", "inherit"]
      })
      
      pendingProcs.push(taskProc)
      
      taskProc.on("close", (code) => {
        if (signalled) return
        
        const msg = `child process close all stdio with code ${code}`
        if (code === 0) {
          logger.info(msg)
        } else {
          logger.log(msg)
        }
        
        if (!deferred.isSettled()) {
          if (code === 0) {
            deferred.resolve(code)
          } else {
            deferred.reject(new Error(msg))
          }
        }
      })
      
      taskProc.on("exit", (code) => {
        if (signalled) return
        
        const msg = `child process exited all stdio with code ${code}`
        if (code === 0) {
          logger.info(msg)
        } else {
          logger.log(msg)
        }
        
        if (!deferred.isSettled()) {
          if (code === 0) {
            deferred.resolve(code)
          } else {
            deferred.reject(new Error(msg))
          }
        }
      })
      
      await deferred.promise
      logger.info(`${prefix} Success`)
    } catch (err) {
      if (!signalled) {
        logger.log(`STEP(${step.name}): Failed`, err)
        throw err
      }
    }
  } else if (typeof task.action === "function") {
    logger.info(`${prefix} Invoking action`)
    let result = task.action(logger)
    if (typeof result?.then === "function") {
      result = await result
    }
    logger.info(`${prefix} Success`)
  } else {
    logger.error(`${prefix} Unable to run task, unknown kind`)
    throw Error(`${prefix} Unable to run task, unknown kind`)
  }
}

async function runStep(step, flow) {
  const log = createLogger(flow, step.name)
  log.info(`STEP(${step.name}): Starting`)
  try {
    const isParallel = step.parallel === true
    if (isParallel) {
      await Promise.all(step.tasks.map(task => runTask(task, step, flow, log)))
    } else {
      for await (const task of step.tasks) {
        await runTask(task, step, flow, log)
      }
    }
    log.info(`STEP(${step.name}): Success`)
  } catch (err) {
    if (!signalled) {
      log.error(`STEP(${step.name}): Failed`, err)
      throw err
    }
  }
}

export async function startWorkflow(flow) {
  const log = createLogger(flow)
  log.info("Starting")
  try {
    for await (const step of flow.steps) {
      await runStep(step, flow)
    }
  } catch (err) {
    if (!signalled) {
      log.error(`Failed`, err)
    }
  }
  
  if (!signalled) {
    cleanupProcs("SIGKILL")()
  }
}

export default startWorkflow

