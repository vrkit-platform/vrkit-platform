import {
  Bind,
  Disposables,
  GlobalActionId,
  GlobalActionIdName,
  isEmpty,
  isNotEmpty,
  OverlayEditorGlobalActionIds,
  OverlayVREditorPropertyName,
  OverlayVREditorPropertyNames,
  OverlayVREditorState
} from "@vrkit-platform/shared"
import type OverlayManager from "./OverlayManager"
import { getLogger } from "@3fv/logger-proxy"
import { deepObserve, IDisposer } from "mobx-utils"
import { IObserveChange } from "../../utils"
import { asOption } from "@3fv/prelude-ts"
import { first, uniq } from "lodash"
import { Container } from "@3fv/ditsy"
import { isFunction, isNumber, isString } from "@3fv/guard"
import { get } from "lodash/fp"
import { OverlayAnchor, VRLayout } from "@vrkit-platform/models"
import { action, runInAction, set, toJS } from "mobx"
import { match } from "ts-pattern"

const log = getLogger(__filename)

type OverlayAnchorValue = typeof OverlayAnchor.CENTER
const AllOverlayAnchors = uniq(Object.values(OverlayAnchor).filter(isNumber)) as OverlayAnchorValue[]

// ALWAYS ON GLOBAL SHORTCUTS
const GlobalAlwaysOnActionIds = Array<GlobalActionIdName>(GlobalActionId.toggleOverlayEditor)

// EDIT MODE ONLY GLOBAL ACTIONS
const GlobalEditOnlyActionIds = OverlayEditorGlobalActionIds.filter(it => it !== GlobalActionId.toggleOverlayEditor)

export class OverlayEditorController {
  private readonly disposers_ = new Disposables()

  private acceleratorDisposer_: IDisposer = null

  private isAttached_: boolean = false

  get actionIds() {
    return OverlayEditorGlobalActionIds
  }

  get state(): OverlayVREditorState {
    return this.manager.appState.overlays.editor
  }

  get isEnabled() {
    return this.state.enabled && this.manager.isVREnabled
  }

  get overlayConfigs() {
    return this.manager.vrOverlays.map(get("config"))
  }

  get selectedOverlayConfigId() {
    return this.state.selectedOverlayConfigId
  }

  get selectedOverlayConfigProp() {
    return this.state.selectedOverlayConfigProp
  }

  updateSelectedOverlayConfigVRLayout(vrLayoutMutator: (vrLayout: VRLayout) => VRLayout) {
    runInAction(() => {
      const selectedId = this.selectedOverlayConfigId,
        win = this.manager.vrOverlays.find(it => it.id === selectedId)
      if (!win) {
        log.warn(`No window for selected id ${selectedId}`)
        return
      }

      this.manager.updateOverlayPlacement(win, (placement, _dashboardConfig) => {
        if (!win.isVR) {
          return placement
        }

        placement.vrLayout = vrLayoutMutator(placement.vrLayout)
        Object.assign(win.placement.vrLayout, toJS(placement.vrLayout))
        win.browserWindow.webContents.invalidate()
        log.debug(`Saving updated dashboard config updated vrLayout`, placement.vrLayout)
        return placement
      })
    })
  }

  executeSelectNextOverlayProp() {
    const idx = asOption(this.selectedOverlayConfigProp)
      .map(value => OverlayVREditorPropertyNames.indexOf(value))
      .filter(idx => idx >= 0)
      .map(idx => (idx + 1) % OverlayVREditorPropertyNames.length)
      .getOrElse(0)

    this.setSelectedOverlayConfigProp(OverlayVREditorPropertyNames[idx])
  }

  @Bind
  setSelectedOverlayConfigId(selectedOverlayConfigId: string) {
    runInAction(() => {
      this.state.selectedOverlayConfigId = selectedOverlayConfigId
    })
  }

  @Bind
  setSelectedOverlayConfigProp(selectedOverlayConfigProp: OverlayVREditorPropertyName) {
    runInAction(() => {
      this.state.selectedOverlayConfigProp = selectedOverlayConfigProp
    })
  }

  @Bind
  executeNextVROverlayEditorInfoAnchor() {
    runInAction(() => {
      // const anchors = this.manager.mainAppState.appSettings.overlayAnchors ?? {},
      //   currentAnchor = asOption(anchors[EditorInfoVROverlayOUID] ?? OverlayAnchor.CENTER)
      //     .map(it => (isString(it) ? OverlayAnchor[it] : it))
      //     .filter(isNumber)
      //     .getOrThrow(`No idea what the current value type is`),
      //   newIdx = asOption(AllOverlayAnchors.indexOf(currentAnchor))
      //     .filter(it => it > -1)
      //     .map(it => (it + 1) % AllOverlayAnchors.length)
      //     .getOrElse(0)
      //
      // anchors[EditorInfoVROverlayOUID] = AllOverlayAnchors[newIdx] as OverlayAnchor
      //
      // set(this.manager.mainAppState.appSettings, "overlayAnchors", anchors)
    })
  }

  @action
  @Bind
  executeNextScreenOverlayEditorInfoAnchor() {
    runInAction(() => {
      // const anchors = this.manager.mainAppState.appSettings.overlayAnchors ?? {},
      //   currentAnchor = asOption(anchors[EditorInfoScreenOverlayOUID] ?? OverlayAnchor.CENTER)
      //     .map(it => (isString(it) ? OverlayAnchor[it] : it))
      //     .filter(isNumber)
      //     .getOrThrow(`No idea what the current value type is`),
      //   newIdx = asOption(AllOverlayAnchors.indexOf(currentAnchor))
      //     .filter(it => it > -1)
      //     .map(it => (it + 1) % AllOverlayAnchors.length)
      //     .getOrElse(0)
      //
      // anchors[EditorInfoScreenOverlayOUID] = AllOverlayAnchors[newIdx] as OverlayAnchor
      //
      // set(this.manager.mainAppState.appSettings, "overlayAnchors", anchors)
    })
  }

  constructor(
    readonly container: Container,
    readonly manager: OverlayManager
  ) {
    // this.actions_ = createVREditorActions(this.container, this)
    // manager.mainActionManager.registerGlobalActions(...this.actions)
    //
    // this.disposers_.push(() => {
    //   manager.mainActionManager.unregisterGlobalActions(...this.actions)
    // })

    this.disposers_.push(this.manager.mainActionManager.enableGlobalActions(...GlobalAlwaysOnActionIds))
    this.disposers_.push(deepObserve(this.manager.state, this.onStateChange.bind(this)))

    this.update()
  }

  [Symbol.dispose]() {
    this.disposers_.dispose()
    this.manager.mainActionManager.disableGlobalActions(...GlobalAlwaysOnActionIds)
  }

  destroy() {
    this[Symbol.dispose]()
  }

  /**
   * Updates the selected overlay configuration and its properties based on the
   * current state. Ensures appropriate defaults are set if no valid selection
   * exists and attaches or detaches resources based on the enablement status.
   *
   * @return {void} This method does not return any value.
   */
  update(): void {
    const { selectedOverlayConfigId, selectedOverlayConfigProp } = this,
      overlayConfigs = this.overlayConfigs

    if (isEmpty(overlayConfigs)) {
      log.warn(`No current overlay configs`)
      return
    }

    asOption(selectedOverlayConfigId)
      .filter(id => overlayConfigs.some(it => it.overlay.id === id))
      .ifNone(() => {
        this.setSelectedOverlayConfigId(first(overlayConfigs).overlay.id)
      })

    asOption(selectedOverlayConfigProp)
      .filter(isNotEmpty)
      .ifNone(() => {
        this.setSelectedOverlayConfigProp("x")
      })

    if (this.isEnabled) {
      this.attach()
    } else {
      this.detach()
    }
  }

  private onStateChange(change: IObserveChange, path: string, root: OverlayVREditorState) {
    this.update()
  }

  private attach(): void {
    if (this.isAttached_) {
      log.info(`Already attached`)
      return
    }

    this.detach()

    this.acceleratorDisposer_ = this.manager.mainActionManager.enableGlobalActions(...GlobalEditOnlyActionIds)
    this.isAttached_ = true
  }

  private detach(): void {
    asOption(this.acceleratorDisposer_)
      .filter(isFunction)
      .ifSome(fn => fn())

    this.manager.mainActionManager.disableGlobalActions(...GlobalEditOnlyActionIds)
    this.isAttached_ = false
  }

  executeSelectOverlay(relativeIndex: number): void {
    const configs = this.overlayConfigs
    if (isEmpty(configs)) {
      log.warn(`No configs, can not execute`)
      return
    }
    const selectedId = asOption(this.selectedOverlayConfigId)
      .filter(id => configs.some(it => it.overlay.id === id))
      .getOrElse(configs[0].overlay.id)

    const idx = asOption(configs.findIndex(it => it.overlay.id === selectedId))
        .map(idx => Math.abs((idx + relativeIndex) % configs.length))
        .getOrThrow(`Unable to find the index for ${selectedId}`),
      newSelectedId = configs[idx].overlay.id

    log.info(`Changing selected id from ${selectedId} to ${newSelectedId}`)
    this.setSelectedOverlayConfigId(newSelectedId)
  }

  executeAdjustSelectedOverlayConfigProp(increment: boolean, by: number = 0.05): void {
    this.updateSelectedOverlayConfigVRLayout(layout => {
      const prop = this.selectedOverlayConfigProp,
        isSize = ["width", "height"].includes(prop),
        aspectRatioWidth = layout.size.height / layout.size.width,
        aspectRatioHeight = layout.size.width / layout.size.height,
        value = increment ? by : -1 * by
      match(prop)
        .with("x", () => {
          layout.pose.x += value
        })
        .with("y", () => {
          layout.pose.eyeY += value
        })
        .with("width", () => {
          layout.size.width += value
          layout.size.height = layout.size.width * aspectRatioWidth
        })
        .with("height", () => {
          layout.size.height += value
          layout.size.width = layout.size.height * aspectRatioHeight
        })
        .run()

      return layout
    })
  }
}
