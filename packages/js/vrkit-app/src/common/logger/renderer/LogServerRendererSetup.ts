import { UPMRendererClientFactory } from "@3fv/electron-utility-process-manager/renderer"
import { type LogServerRequestMap, LogServerServiceName } from "../LogServerTypes"
import { generateId } from "@vrkit-platform/shared"
import { LogServerClientAppender } from "../LogServerClientAppender"
import { ConsoleAppender, getLoggingManager } from "@3fv/logger-proxy"
import { isDefined } from "@3fv/guard"

/**
 * Create a new log server for a renderer process
 *
 * @param clientId
 */
export async function LogServerRendererSetup(clientId: string = `renderer-${generateId()}`) {
  const messageClient = await UPMRendererClientFactory.createClient<LogServerRequestMap>(LogServerServiceName, clientId)

  const appender = new LogServerClientAppender(messageClient),
      appenders = [appender, isDev && new ConsoleAppender()].filter(isDefined)
  if (import.meta.webpackHot) {
    import.meta.webpackHot.addDisposeHandler(() => {
      appender.closeImmediate()
      messageClient.close()
    })
  }
  
  getLoggingManager().setAppenders(appenders)
  return appender
}

export default LogServerRendererSetup
