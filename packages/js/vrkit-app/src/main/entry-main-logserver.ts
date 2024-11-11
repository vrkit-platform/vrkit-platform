import {FileAppender} from "@3fv/logger-proxy/appenders/FileAppender.js"
import upmNodeProcess from "../common/upm/node"
import Tracer from "tracer"

const log = Tracer.console()

upmNodeProcess.addEventHandler((clientId, port, payload) => {
  log.info(`Received event from (${clientId})`, payload)
  return true
})
// Child process
//process.parentPort.on('message', (ev) => {
  
  // log.info(`Child process received event with port`,ev)
  // port = ev.ports[0]
  // port.start()
  // port.postMessage({
  //   name: "child process"
  // })
  // port.on("message", ev => {
  //   // log.info(`Child process received event ON port`,ev)
  // })
  //
  // ...
//})

export {}