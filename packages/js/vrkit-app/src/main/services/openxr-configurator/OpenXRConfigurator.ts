import WinReg, { RegistryItem } from "winreg"
import { getLogger } from "@3fv/logger-proxy"
import { PostConstruct, Singleton } from "@3fv/ditsy"

import { assert, Disposables,  isArray } from "@vrkit-platform/shared"
import { FindPathInTree } from "@vrkit-platform/shared/utils/node"
import PQueue from "p-queue"
import { isDev } from "../../constants"

// noinspection TypeScriptUnresolvedVariable
const log = getLogger(__filename)

// noinspection JSUnusedLocalSymbols
const { debug, trace, info, error, warn } = log

// noinspection UnnecessaryLocalVariableJS
const
    openXRSetupEnabled = isElectronPackaged,
    openXRLayerFilename = "openxr-api-layer.json",
    openXRConfigFileResult = FindPathInTree(["resources", "openxr-layer", openXRLayerFilename], {
      dir: __dirname,
      type: "file"
    }),
    openXRRegKey = "\\Software\\Khronos\\OpenXR\\1\\ApiLayers\\Implicit"

log.info(`OpenXRLayerConfigFileResult=${JSON.stringify(openXRConfigFileResult)}`)

if (openXRSetupEnabled) {
  assert(isArray(openXRConfigFileResult), `Unable to find ${openXRLayerFilename}`)
}

const openXRConfigFile = openXRConfigFileResult?.[1] ?? openXRLayerFilename
const openXRConfigFileArg = `"${openXRConfigFile}"`


export interface OpenXRLayerLibrary {
  file: string
  enabled: boolean
  item: RegistryItem
}

function registryItemToLibrary(item: RegistryItem) {
  return {
    file: item.name,
    enabled: ![1,"1","0x1"].includes(item.value),
    item
  }
}

@Singleton()
export class OpenXRConfigurator {
  private readonly disposers_ = new Disposables()
  
  private readonly layersKey_ = new WinReg({
    hive: WinReg.HKLM,
    key: openXRRegKey
  })
  
  
  private readonly workQueue_ = new PQueue({
    concurrency: 1
  })

  private async installLayer(forceUpdate: boolean = false, setEnabled: boolean = true) {
    if (!openXRSetupEnabled) {
      log.warn(`OpenXR is only installed via a packaged build`)
      return
    }
    
    let layer = await this.getLayer()
    if (layer && !forceUpdate) {
      log.info(`OpenXR layer is already installed`)
      return
    }
    
    log.info(`OpenXR layer is being created or force enabled`)
    await new Promise<void>((resolve, reject) => {
      this.layersKey.set(openXRConfigFileArg, WinReg.REG_DWORD, setEnabled ? "0x0" : "0x1", err => {
        if (err) {
          log.error("Unable to configure OpenXR Layers in registry", err)
          reject(err)
        } else {
          resolve()
        }
      })
    })
    
    layer = await this.getLayer()
    assert(layer?.enabled === true, "Layer should be valid now")
    
  }

  /**
   * Resource cleanup
   */
  private [Symbol.dispose]() {
    this.disposers_.dispose()
  }

  /**
   * Simply calls dispose
   * @private
   */
  private unload() {
    this[Symbol.dispose]()
  }

  /**
   * Initialize
   */
  @PostConstruct()
  private async init() {
    if (isDev) {
      Object.assign(global, {
        openXRConfigurator: this
      })
    }
    
    await this.installLayer()
  }

  constructor() {}
  
  get configFile() {
    return openXRConfigFile
  }
  
  get layersKey() {
    return this.layersKey_
  }
  
  async getLayer() {
    const layers = await this.allLayers()
    return layers.find(it => it.file === openXRConfigFile)
  }
  
  async isLayerInstalled() {
    const layer = await this.getLayer()
    return !!layer
  }
  
  async isLayerEnabled() {
    const layer = await this.getLayer()
    return layer?.enabled ?? false
  }
  
  allLayers(): Promise<OpenXRLayerLibrary[]> {
    const {layersKey} = this
    return new Promise<OpenXRLayerLibrary[]>((resolve, reject) => {
      layersKey.values((err, items) => {
        if (err)
          reject(err)
        resolve(items.map(registryItemToLibrary))
      })
    })
  }
}

export default OpenXRConfigurator
