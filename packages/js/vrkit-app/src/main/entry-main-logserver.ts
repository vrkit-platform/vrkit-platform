import {FileAppender} from "@3fv/logger-proxy/appenders/FileAppender.js"
// const Tracer = require("tracer")
// const log = Tracer.console()

let port = null

// Child process
process.parentPort.once('message', (ev) => {
  // log.info(`Child process received event with port`,ev)
  port = ev.ports[0]
  port.start()
  port.postMessage({
    name: "child process"
  })
  port.on("message", ev => {
    // log.info(`Child process received event ON port`,ev)
  })
  
  // ...
})

export {}