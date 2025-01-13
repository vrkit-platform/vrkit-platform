import { getLogger } from "@3fv/logger-proxy"
import { session } from "electron"
import { Deferred } from "@3fv/deferred"
import Path from "path"
import { isString } from "@3fv/guard"

const log = getLogger(__filename)
const { debug, trace, info, error, warn } = log

async function installDevTools() {
  if (process.env.NODE_ENV === "production") {
    return
  }
  const {
    default: installExtensions,
    REDUX_DEVTOOLS,
    REACT_DEVELOPER_TOOLS
  } = await import("@tomjs/electron-devtools-installer")
  
  info(`Installing devtools`)

  const reactDevToolExtId = REACT_DEVELOPER_TOOLS
  const includeRedux = false
  const extensions = [reactDevToolExtId, includeRedux && REDUX_DEVTOOLS].filter(isString)
  const targetSession = session.defaultSession

  targetSession.flushStorageData()

  const installExtInternal = async () => {
    let res = await installExtensions(extensions, {
      loadExtensionOptions: {
        allowFileAccess: true
      },
      session: targetSession
    })
    info(`Installed devtool`, res)
    return res
  }

  const installedExts = await installExtInternal()
  const reactExtIdInstalled = installedExts[0].id

  await Deferred.delay(100)

  const allExts = targetSession.getAllExtensions()
  log.assert(
    allExts.some(ext => ext.id === reactExtIdInstalled && Path.basename(ext.path) === reactDevToolExtId),
    "React ext not found in all"
  )

  const reactExt = targetSession.getExtension(reactExtIdInstalled)
  log.assert(reactExt !== null, "React extension not found")

  const reactExtLoaded = await targetSession.loadExtension(reactExt.path)
  log.assert(reactExtLoaded !== null, "React extension not loaded")
}

export default installDevTools
