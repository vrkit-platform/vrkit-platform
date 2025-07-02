
import { IRacingIPCClient } from "vrkit-native-interop"
import * as Repl from "repl"
import { type CommandModule } from "yargs"
import * as Path from "path"
import { SessionDataFrame, SessionEventType } from "@vrkit-platform/models"
import { getLogger } from "@3fv/logger-proxy"

const log = getLogger(__filename),
  { debug, trace, info, error, warn } = log

// const log = console,
//     { debug, trace, info, error, warn } = log

export const IRacingIPCClientCommand: CommandModule = {
  command: "irc-client",
  describe: "Start the iRacing IPC client",
  handler: async yargs => {
    process.on("uncaughtException", err => {
      console.error("Uncaught Exception:", err)
    })
    const
      irc = new IRacingIPCClient("vrkit_iracing_ipc_server"),
      historyFile = Path.join(process.cwd(), ".repl-history-irc-client")
    
    info(`Using history file: ${historyFile}`)
    irc.on(SessionEventType.DATA_FRAME, (_, dataFrame: SessionDataFrame) => {
      info("Received data frame:", dataFrame)
    })
    
    const repl = Repl.start({
      prompt: "iracing-ipc> ",
      useColors: true,
      useGlobal: true,
      replMode: Repl.REPL_MODE_SLOPPY,
      breakEvalOnSigint: true,
      preview: true
    })

    repl.setupHistory(historyFile, err => {
      if (!err) {
        return
      }

      error("Error occurred while setting up history:", err)
    })

    repl.prompt()

    const stopHandler = () => {
      repl.close()
      process.exit(0)
    }

    process.on("SIGINT", stopHandler)
    process.on("SIGQUIT", stopHandler)
    process.on("SIGKILL", stopHandler)
  }
}

export default IRacingIPCClientCommand
