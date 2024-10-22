import { Level, Logger } from "@3fv/logger-proxy"

export class InstancePrefixLogger {

  log(level: Level, message: string, ...args: any[]) {
    this.logger[level](`${this.prefix} ${message}`, ...args)
  }

  debug(message: string, ...args: any[]) {
    this.log(Level.debug, message, ...args)
  }

  info(message: string, ...args: any[]) {
    this.log(Level.info, message, ...args)
  }
  warn(message: string, ...args: any[]) {
    this.log(Level.warn, message, ...args)
  }
  error(message: string, ...args: any[]) {
    this.log(Level.error, message, ...args)
  }

  constructor(
    readonly logger: Logger,
    readonly prefix: string
  ) {

  }
}
