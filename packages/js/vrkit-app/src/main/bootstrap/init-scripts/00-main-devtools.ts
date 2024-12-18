import installExtensions, {
  REDUX_DEVTOOLS,
  REACT_DEVELOPER_TOOLS
} from "@tomjs/electron-devtools-installer"
import { getLogger } from "@3fv/logger-proxy"
import { session } from "electron"
import { Deferred } from "@3fv/deferred"
import Path from "path"

const log = getLogger(__filename)
const { debug, trace, info, error, warn } = log

async function installDevTools() {
  info(`Installing devtools`)

  const reactDevToolExtId = REACT_DEVELOPER_TOOLS
  const extensions = [reactDevToolExtId, REDUX_DEVTOOLS]
  const targetSession =  session.defaultSession


  //targetSession.flushStorageData()
  //
  // const installExtInternal = async () => {
  //   let res = await installExtensions(extensions, {
  //     loadExtensionOptions: {
  //       allowFileAccess: true
  //     },
  //     session: targetSession
  //   })
  //   info(`Installed devtool`, res)
  //   return res
  // }
  //
  // // TODO: Figure out why this has to run twice for React Dev Tools to be
  // //  Available on first load
  // // await Promise.all(range(2).map(installExtInternal))
  //
  // const installedExts = await installExtInternal()
  // const reactExtIdInstalled = installedExts[0].id
  //
  // //targetSession.flushStorageData()
  // // await Deferred.delay(250)
  // await Deferred.delay(100)
  //
  // const allExts = targetSession.getAllExtensions()
  // log.assert(allExts.some(ext => ext.id === reactExtIdInstalled && Path.basename(ext.path) === reactDevToolExtId), "React ext not found in all")
  //
  // const reactExt = targetSession.getExtension(reactExtIdInstalled)
  // log.assert(reactExt !== null, "React extension not found")
  //
  // const reactExtLoaded = await targetSession.loadExtension(reactExt.path)
  // log.assert(reactExtLoaded !== null, "React extension not loaded")

}

export default installDevTools
