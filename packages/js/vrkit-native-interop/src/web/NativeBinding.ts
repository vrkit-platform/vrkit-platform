// var addon = require('bindings')('SayHello');
// noinspection ES6UnusedImports

import Bind from "bindings"

import * as Path from "node:path"
import { asOption, Option } from "@3fv/prelude-ts"
import { getLogger } from "@3fv/logger-proxy"
import * as Fs from "node:fs"
import { Deferred } from "@3fv/deferred"
import type { NativeSessionPlayerCtor } from "./NativeSessionPlayer"
import type { NativeClientCtor } from "./NativeClient"
import type { NativeOverlayManagerCtor } from "./NativeOverlayManager"

const log = getLogger(__filename)

/**
 * Container for holding native exports
 */
const gNativeLib = {
  exports: null as NativeExports
}

/**
 * Native library possible targets
 */
const kNativeLibTargets = ["Debug", "Release"]
const electronResourcesPath = (process as any).resourcesPath

function findNativeModulePaths(): string[] {
  const nativeFiles = kNativeLibTargets.flatMap(target => {
    const
      candidates = [
        Path.resolve(electronResourcesPath, "native", "out", target, "vrkit_native_interop.node"),
        Path.resolve(electronResourcesPath, "out", target, "vrkit_native_interop.node"),
        Path.resolve(__dirname, "..", "out", target, "vrkit_native_interop.node")
      ].filter(it => !it.includes(".asar"))
    log.info(`Native lib candidate files: ${candidates.join(", ")}`)
    return candidates.filter(f => Fs.existsSync(f))
  })

  log.info(`Native lib files: ${nativeFiles.join(", ")}`)
  return nativeFiles
}

/**
 * Internal cleanup function, which removes all cached references to
 * the underlying native library
 */
function ReleaseNativeExports(): void {
  if (gNativeLib.exports) {
    delete gNativeLib.exports
  }

  gNativeLib.exports = null

  if (typeof require !== "undefined") {
    findNativeModulePaths().forEach(targetPath =>
      asOption(targetPath)
        .flatMap(targetPath => {
          return Option.try(() => require.resolve(targetPath))
        })
        .ifSome(resolvedPath => {
          delete require.cache[resolvedPath]
        })
    )
  }
}

/**
 * Loads the native library OR returns existing ref if already loaded
 */
export function GetNativeExports() {
  if (!gNativeLib.exports) {
    const nativeFiles = findNativeModulePaths()
    log.assert(!!nativeFiles.length, `No native node modules found`)

    const nativeFile = nativeFiles[0],
      nativeRoot = Path.dirname(Path.dirname(Path.dirname(nativeFile)))
    log.info(`nativeRoot=${nativeRoot},nativeFile=${nativeFile}`)

    gNativeLib.exports = Bind({
      // compiled: nativeFile,
      module_root: electronResourcesPath,//"./" + Path.relative(process.cwd(), nativeRoot),
      bindings: "vrkit_native_interop.node",
      try: [["resources","native","out","Debug"],["native","out","Debug"],["out","Debug"]]
          .map(parts => ["module_root",...parts,"vrkit_native_interop.node"])
    })
  }

  return gNativeLib.exports
}

/**
 * Shutdown/Cleanup/Destroy native clients (all in the current context) &
 * unload/release the library references
 */
export async function Shutdown() {
  if (gNativeLib.exports) {
    gNativeLib.exports.Shutdown()
  }

  ReleaseNativeExports()

  await Deferred.delay(100)
}

/**
 * Native library exports
 */
export interface NativeExports {
  /**
   * Native node module client
   */
  NativeClient: NativeClientCtor

  NativeSessionPlayer: NativeSessionPlayerCtor

  NativeOverlayManager: NativeOverlayManagerCtor

  /**
   * Shutdown the underlying client
   *
   * @constructor
   */
  Shutdown(): void
}
