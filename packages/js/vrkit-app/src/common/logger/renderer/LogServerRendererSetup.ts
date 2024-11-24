import { UPMRendererClientFactory } from "@3fv/electron-utility-process-manager/renderer"
import { type LogServerRequestMap, LogServerServiceName } from "../LogServerTypes"
import { generateId } from "vrkit-shared"
import { LogServerClientAppender } from "../LogServerClientAppender"
import { ConsoleAppender, getLoggingManager } from "@3fv/logger-proxy"

/**
 * Create a new log server for a renderer process
 *
 * @param clientId
 */
export async function LogServerRendererSetup(clientId: string = `renderer-${generateId()}`) {
  const messageClient = await UPMRendererClientFactory.createClient<LogServerRequestMap>(LogServerServiceName, clientId)

  const appender = new LogServerClientAppender(messageClient)
  getLoggingManager().addAppenders(appender, new ConsoleAppender())
  return appender
}

export default LogServerRendererSetup
