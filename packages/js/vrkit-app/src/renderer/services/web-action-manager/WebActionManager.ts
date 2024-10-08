import { getLogger } from "@3fv/logger-proxy"
import { Inject, PostConstruct, Singleton } from "@3fv/ditsy"
import {
  Action,
  ActionAccelerator,
  ActionKeyInterceptor,
  ActionOptions,
  ActionRegistry,
  AppActionId,
  WebAppActions
} from "vrkit-app-common/services"
import { Bind, LazyGetter } from "vrkit-app-common/decorators"
import { APP_STORE_ID, isDev } from "../../constants"

import {
  isInputElement
} from "../../utils"

import { AppStore } from "../store"
import { selectSettings } from "../store/selectors/GlobalSelectors"
import { ElectronMainAppActions } from "vrkit-app-common/services/actions/ElectronMainAppActions"
import {
  addWindowListener,
  removeWindowListener
} from "../actions-web/WebActionUtil"

// noinspection TypeScriptUnresolvedVariable
const log = getLogger(__filename)
// noinspection JSUnusedLocalSymbols
const { debug, trace, info, error, warn } = log

const KeyRepeatDelay = 175

/**
 * Global actions
 */


@Singleton()
export class WebActionManager {

  /**
   * All app-wide actions allowed
   * in the browser
   *
   * @private
   */
  @LazyGetter
  private get webAppActions():Array<ActionOptions> {
    return [
      // {
      //   ...WebAppActions.importProject,
      //   execute: () => {
      //     showAppDialog(this.appStore.dispatch, AppDialogType.projectImport)
      //   }
      // },
      // {
      //   ...WebAppActions.newProject,
      //   execute: () => {
      //     showAppDialog(this.appStore.dispatch, AppDialogType.projectEditor)
      //   }
      // },
    ]

  }

  /**
   * Last key repeat epoch
   */
  private lastRepeatTimestamp = 0

  /**
   * body listeners
   */
  private bodyListeners: Record<string, EventListener>

  /**
   * Document object listeners
   */
  private documentListeners: Record<string, EventListener>

  /**
   * Window & document listeners
   */
  private windowListeners: Record<string, EventListener>

  /**
   * Key interceptor for every event
   */
  private keyInterceptor: ActionKeyInterceptor

  /**
   * Get custom accelerators
   */
  private get customAccelerators() {
    return selectSettings(this.appStore.getState())
  }

  /**
   * Focus on the top WebActionContainer
   */
  @Bind
  private focusAuto() {
    if (document.activeElement === document.body) {
      const focusable = document.querySelector("[data-autofocus]") as HTMLElement
      if (focusable) {
        focusable.focus()
      }
    }
  }

  /**
   * On window blur
   *
   * @param event
   */
  @Bind
  private onWindowBlur(event: FocusEvent) {
    if (log.isTraceEnabled()) {
      log.trace(`blur event`, event, document.activeElement)
    }
    event.preventDefault()
    event.stopImmediatePropagation()
    event.stopPropagation()
  }

  /**
   * on window focus
   *
   * @param event
   */
  @Bind
  private onWindowFocus(event: FocusEvent) {
    debug(`focus event`, event, "active element is", document.activeElement)
    this.focusAuto()
  }

  @Bind
  private onDocumentFocus(event: any = undefined) {
    debug(
      `document focus event`,
      event,
      "active element is",
      document.activeElement
    )
    this.focusAuto()
  }

  @Bind
  isInputTarget(event: KeyboardEvent, fromInputOverride: boolean = false) {
    return (
      (event.target && isInputElement(event.target as HTMLElement)) ||
      fromInputOverride
    )
  }

  /**
   * on body focus
   *
   * @param event
   */
  @Bind
  private onBodyFocus(event: FocusEvent) {
    if (isDev && log.isDebugEnabled()) {
      debug(
        `body focus event`,
        event,
        "active element is",
        document.activeElement
      )
    }
    this.focusAuto()
  }

  /**
   * on doc body blur
   *
   * @param event
   */
  @Bind
  private onBodyBlur(event: FocusEvent) {
    debug(`body blur event`, event)
  }

  @Bind
  private unload(event: Event) {
    debug(`Unloading all commands`)
    // this.unmountCommand(...Object.values(this.commandMap))
  }

  /**
   * Handle the key down event
   *
   * @param event
   * @param fromInputOverride - for md editing really
   */
  @Bind
  onKeyDown(event: KeyboardEvent, fromInputOverride: boolean = false) {
    // if (document.activeElement === document.body) {
    //   info(`Body has focus`)

    //   event.preventDefault()
    //   event.stopPropagation()
    //   event.stopImmediatePropagation?.()

    //   return
    // }

    if (this.keyInterceptor && this.keyInterceptor(event) === false) {
      event.preventDefault()
      event.stopPropagation()

      return
    }

    // Check if should be ignored
    if (event.repeat) {
      const now = Date.now()
      if (now - this.lastRepeatTimestamp < KeyRepeatDelay) {
        return
      } else {
        this.lastRepeatTimestamp = now
      }
    } else {
      this.lastRepeatTimestamp = 0
    }

    const action = this.matchAction(event, fromInputOverride)
    if (!action) {
      return false
    }
    event.preventDefault()
    event.stopPropagation()
    event.stopImmediatePropagation?.()
    info("Executing", action)
    action.execute(action, event)
    return true

  }

  /**
   * Find a matching command and accelerator
   *
   * @param commands
   * @param customAccelerators
   * @param event
   * @returns {[ICommand,CommandAccelerator]}
   */
  private matchAcceleratorAndAction(
    actions: Action[],
    customAccelerators: Record<string, string> = {},
    event: KeyboardEvent
  ): [Action, ActionAccelerator] {
    for (const action of actions) {
      const accel = customAccelerators[action.id] || action.defaultAccelerators
      if (ActionAccelerator.matchToEvent(accel, event)) {
        return [action, new ActionAccelerator(event)]
      }
    }
    return null
  }

  /**
   * Find an action matching the current
   * input event
   *
   * @param event
   * @param fromInputOverride
   * @returns
   */
  matchAction(event: KeyboardEvent, fromInputOverride: boolean = false) {
    const actions = this.actionRegistry.allActions,
      isInputTarget = this.isInputTarget(event, fromInputOverride),
      testMatch = this.matchAcceleratorAndAction(
        actions,
        {}, // customAccelerators,
        event
      )

    if (testMatch) {
      const [testAction, accel] = testMatch

      if (
        testAction &&
        (!isInputTarget ||
          testAction.overrideInput ||
          accel.hasNonInputModifier)
      ) {
        return testAction
      }
    }

    return undefined
  }

  /**
   * Attach to event producers
   */
  private attachEventHandlers() {
    if (typeof window !== "undefined") {
      if (!this.documentListeners) {
        this.documentListeners = {
          focusin: this.onDocumentFocus
        }
      }

      if (!this.windowListeners) {
        this.windowListeners = {
          focus: this.onWindowFocus,
          blur: this.onWindowBlur,
          keydown: this.onKeyDown,
          unload: this.unload
        }

        this.bodyListeners = {
          focus: this.onBodyFocus,
          blur: this.onBodyBlur
        }

        Object.keys(this.windowListeners).forEach((eventName: string) => {
          addWindowListener(eventName, this.windowListeners[eventName])
        })

        Object.entries(this.documentListeners).forEach(
          ([eventName, listener]) => {
            document && document.addEventListener(eventName, listener)
          }
        )

        Object.keys(this.bodyListeners).forEach((eventName: string) => {
          !!document?.body &&
            document.body.addEventListener(
              eventName,
              this.bodyListeners[eventName]
            )
        })

        if (import.meta.webpackHot) {
          import.meta.webpackHot?.addDisposeHandler(() => {
            this.detachEventHandlers()
          })
        }
      }
    }
  }

  /**
   * Detach event handlers
   */
  detachEventHandlers() {
    if (this.windowListeners) {
      debug(`Detaching window listeners`)

      Object.keys(this.windowListeners).forEach((eventName: string) => {
        removeWindowListener(eventName, this.windowListeners[eventName])
      })

      Object.entries(this.documentListeners).forEach(
        ([eventName, listener]) => {
          document && document.removeEventListener(eventName, listener)
        }
      )

      Object.keys(this.bodyListeners).forEach((eventName: string) => {
        document &&
          document.body &&
          document.body.removeEventListener(
            eventName,
            this.bodyListeners[eventName]
          )
      })

      this.windowListeners = null
      this.bodyListeners = null
    }
  }

  /**
   * Add all app-wide actions
   * @private
   */
  @PostConstruct()
  // @ts-ignore
  private async init() {

    /// REGISTER WEB APP ACTIONS
    this.actionRegistry.addAll(...this.webAppActions)

    // IF ELECTRON, REGISTER MAIN APP ACTIONS
    // if (isElectron) {
    //   this.actionRegistry.addAll(
    //     Object.values(ElectronMainAppActions).map(options => ({
    //       ...options,
    //       execute: () => {
    //         invokeElectronMainAction?.(options.id)
    //       }
    //     }))
    //   )
    // }

    this.attachEventHandlers()

    if (isDev) {
      Object.assign(global, {
        actionManager: this,
        webActionManager: this
      })
    }

    if (typeof window !== "undefined") {
      info(`Attaching shortcut remover to window unload`)
      // window.addEventListener("beforeunload", removeShortcuts)
      // window.addEventListener("close", removeShortcuts)
    }
  }

  constructor(
    readonly actionRegistry: ActionRegistry,
    @Inject(APP_STORE_ID)
    readonly appStore: AppStore
  ) {}
}

export default WebActionManager
