import {
  OverlayVREditorEventType,
  OverlayVREditorEventTypeToIPCName,
  OverlayVREditorFnType, OverlayVREditorFnTypeToIPCName,
  OverlayVREditorState,
  OverlayVREditorStateSchema
} from "../../../common/models"
import type { OverlayBrowserWindow } from "./OverlayBrowserWindow"
import type OverlayManager from "./OverlayManager"
import { ipcMain, IpcMainInvokeEvent } from "electron"
import { serialize } from "serializr"
import { makeObservable, observable, set } from "mobx"
import { OverlayConfig } from "vrkit-models"
import { BindAction } from "../../decorators"
import { Disposables, Pair } from "../../../common/utils"
import { Bind } from "../../../common/decorators"
import { getLogger } from "@3fv/logger-proxy"
import { deepObserve } from "mobx-utils"
import { VREditorOverlayOUID } from "./DefaultOverlayConfigData"

const log = getLogger(__filename)

class OverlayVREditorStateImpl implements OverlayVREditorState {
  @observable
  overlayConfigs: OverlayConfig[] = []

  @observable
  selectedOverlayConfigId: string = ""
}

export class OverlayVREditorController {
  private readonly state_ = new OverlayVREditorStateImpl()
  private readonly disposers_ = new Disposables()
  
  get state(): OverlayVREditorState {
    return this.state_
  }

  get stateJSON() {
    return serialize(OverlayVREditorStateSchema, this.state_)
  }

  get overlayConfigs() {
    return []
  }

  get selectedOverlayConfigId() {
    return this.state.selectedOverlayConfigId
  }

  @BindAction()
  setOverlayConfigs(overlayConfigs: OverlayConfig[]) {
    // set(this.state_, "overlayConfigs", overlayConfigs)
    this.state_.overlayConfigs = overlayConfigs
  }

  @BindAction()
  setSelectedOverlayId(selectedOverlayConfigId: string) {
    // set(this.state_, "selectedOverlayId", selectedOverlayId)
    this.state_.selectedOverlayConfigId = selectedOverlayConfigId
  }

  @Bind
  private onStateChange() {
    this.broadcastState()
  }
  
  /**
   * Send state to renderer
   *
   * @private
   */
  private broadcastState() {
    const json = this.stateJSON
    log.debug("VR Editor state", json)
    const win = this.manager.vrEditorWindow
    if (!win) {
      log.error(`No current VR editor window`)
      return null
    }
    
    win.window.webContents.send(OverlayVREditorEventTypeToIPCName(OverlayVREditorEventType.STATE_CHANGED), json)
  }

  private async fetchStateHandler(event: IpcMainInvokeEvent) {
    return this.stateJSON
  }

  constructor(
    readonly manager: OverlayManager
  ) {
    makeObservable(this.state_)

    this.disposers_.push(deepObserve(this, this.onStateChange))
    
    const ipcFnHandlers = Array<Pair<OverlayVREditorFnType, (event: IpcMainInvokeEvent, ...args: any[]) => any>>(
      [OverlayVREditorFnType.FETCH_STATE, this.fetchStateHandler.bind(this)],
    )
    
    ipcFnHandlers.forEach(([type, handler]) => ipcMain.handle(OverlayVREditorFnTypeToIPCName(type), handler))
    
    this.disposers_.push(() => {
      ipcFnHandlers.forEach(([type]) => ipcMain.removeHandler(OverlayVREditorFnTypeToIPCName(type)))
    })
    
    this.updateOverlaysFromState()
  }
  
  [Symbol.dispose]() {
    this.disposers_.dispose()
  }
  
  destroy() {
    this[Symbol.dispose]()
  }
  
  updateOverlaysFromState() {
    const vrWindows = this.manager.vrOverlays.filter(it => it.uniqueId !== VREditorOverlayOUID),
        overlayConfigs = vrWindows.map(it => it.config)
    
    this.setOverlayConfigs(overlayConfigs)
    
  }
}