import { OverlayVREditorState } from "../../../common/models"
import type OverlayManager from "./OverlayManager"
import { BindAction } from "../../decorators"
import { Disposables, isEmpty } from "../../../common/utils"
import { getLogger } from "@3fv/logger-proxy"
import { deepObserve, IDisposer } from "mobx-utils"
import { IObserveChange } from "../../utils"
import { asOption } from "@3fv/prelude-ts"
import { first } from "lodash"
import { Action, ActionRuntime, ActionType } from "../../../common/services"
import { Container } from "@3fv/ditsy"
import { isFunction } from "@3fv/guard"
import { get } from "lodash/fp"

const log = getLogger(__filename)

function createVREditorActions(container: Container, editor: OverlayVREditorController): Action[] {
  const toId = (...parts: string[]) => ["vr.editor.overlay", ...parts].join("."),
    toAccelerators = (...accelerators: string[]) => ({
      defaultAccelerators: accelerators,
      accelerators
    })
  const defaultActionProps: Partial<Action> = {
    runtime: ActionRuntime.main,
    overrideInput: true,
    hidden: false, disableKeyReassign: false
  }
  return [
    {
      id: toId("switch", "next"),
      type: ActionType.Global,
      ...toAccelerators("Control+Alt+2"),
      execute: () => {
        editor.executeSelectOverlay(1)
      },
      ...defaultActionProps
    },
    {
      id: toId("switch", "previous"),
      type: ActionType.Global,
      ...toAccelerators("Control+Alt+1"),
      execute: () => {
        editor.executeSelectOverlay(-1)
      },
      ...defaultActionProps
    }
  ] as Action[]
}

export class OverlayVREditorController {
  private readonly disposers_ = new Disposables()

  private acceleratorDisposer_: IDisposer = null

  private isAttached_: boolean = false

  private readonly actions_: Action[]

  get actions() {
    return this.actions_
  }

  get actionIds() {
    return this.actions.map(get("id"))
  }

  get state(): OverlayVREditorState {
    return this.manager.mainAppState.overlays.editor
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

  @BindAction()
  setSelectedOverlayConfigId(selectedOverlayConfigId: string) {
    this.state.selectedOverlayConfigId = selectedOverlayConfigId
  }

  constructor(
    readonly container: Container,
    readonly manager: OverlayManager
  ) {
    this.actions_ = createVREditorActions(this.container, this)
    manager.mainActionManager.registerGlobalActions(...this.actions)

    this.disposers_.push(() => {
      manager.mainActionManager.unregisterGlobalActions(...this.actions)
    })

    this.disposers_.push(deepObserve(this.manager.state, this.onStateChange.bind(this)))

    this.update()
  }

  [Symbol.dispose]() {
    this.disposers_.dispose()
  }

  destroy() {
    this[Symbol.dispose]()
  }

  update() {
    const { selectedOverlayConfigId } = this,
      overlayConfigs = this.overlayConfigs

    if (isEmpty(overlayConfigs)) {
      log.warn(`No current overlay configs`)
      return
    }

    asOption(selectedOverlayConfigId)
      .filter(id => overlayConfigs.some(it => it.overlay.id))
      .ifNone(() => {
        this.setSelectedOverlayConfigId(first(overlayConfigs).overlay.id)
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

    this.acceleratorDisposer_ = this.manager.mainActionManager.enableGlobalActions(...this.actionIds)
    this.isAttached_ = true
  }

  private detach(): void {
    asOption(this.acceleratorDisposer_)
      .filter(isFunction)
      .ifSome(fn => fn())

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
}