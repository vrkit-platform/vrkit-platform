import Yargs from "yargs"
import IRCClientCommand from "./irc-client"

const yargs = Yargs(process.argv.slice(2))
  .command(IRCClientCommand)
  .parse()

export {}