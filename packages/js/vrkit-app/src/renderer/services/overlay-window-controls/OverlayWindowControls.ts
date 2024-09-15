import { getLogger } from "@3fv/logger-proxy"
import { PostConstruct, Singleton } from "@3fv/ditsy"
import { Bind } from "vrkit-app-common/decorators"
import { isDev } from "../../constants"
import "./OverlayWindowControls.scss"
import { OverlayWindowMainEvents, OverlayWindowRendererEvents } from "vrkit-app-common/models/overlay-manager"
import { ipcRenderer, IpcRendererEvent } from "electron"

// noinspection TypeScriptUnresolvedVariable
const log = getLogger(__filename)

// noinspection JSUnusedLocalSymbols
const { debug, trace, info, error, warn } = log


const WinRendererEvents = OverlayWindowRendererEvents
const WinMainEvents = OverlayWindowMainEvents


function createDivWithId(elementId: string): HTMLElement {
  const el = document.createElement("div")
  el.id = elementId
  return el
}

const { body } = document

@Singleton()
export class OverlayWindowControls {
  readonly titlebarEl: HTMLElement = createDivWithId("titlebar")
  readonly labelEl: HTMLElement = createDivWithId("titlebarLabel")
  readonly controlsEl: HTMLElement = createDivWithId("titlebarControls")

  @Bind
  private onMouseEnter(event: Event) {
    // log.info(`onMouseEnter`)
    // body.classList.add("hover")
    // ipcRenderer.send(WinRendererEvents.EventTypeToIPCName(WinRendererEvents.EventType.MOUSE_ENTER))
  }

  @Bind
  private onMouseLeave(event: Event) {
    // log.info(`onMouseLeave`)
    // body.classList.remove("hover")
    // ipcRenderer.send(WinRendererEvents.EventTypeToIPCName(WinRendererEvents.EventType.MOUSE_LEAVE))
  }
  
  @Bind
  private onMainControlsEnabled(ev: IpcRendererEvent, enabled: boolean) {
    if (enabled)
      body.classList.add("hover")
    else
      body.classList.remove("hover")
  }

  /**
   * Cleanup resources on unload
   *
   * @param event
   * @private
   */
  @Bind
  private unload(event?: Event) {
    debug(`Unloading overlay window controls`)

    body.removeEventListener("mouseenter", this.onMouseEnter)
    body.removeEventListener("mouseleave", this.onMouseLeave)
  }

  /**
   * Add all app-wide actions
   * @private
   */
  @PostConstruct()
  // @ts-ignore
  // tslint:disable-next-line
  private async init(): Promise<void> {
    // tslint:disable-next-line
    window.addEventListener("beforeunload", this.unload)
    this.labelEl.innerHTML = "Overlay"
    this.titlebarEl.appendChild(this.labelEl)
    this.titlebarEl.appendChild(this.controlsEl)
    body.appendChild(this.titlebarEl)
    
    ipcRenderer.on(WinMainEvents.EventTypeToIPCName(WinMainEvents.EventType.CONTROLS_ENABLED), this.onMainControlsEnabled)
    // body.addEventListener("mouseenter", this.onMouseEnter)
    // body.addEventListener("mouseleave", this.onMouseLeave)

    if (import.meta.webpackHot) {
      import.meta.webpackHot.addDisposeHandler(() => {
        this.unload()
      })
    }

    if (isDev) {
      Object.assign(window, {
        overlayWindowControls: this
      })

      if (import.meta.webpackHot) {
        import.meta.webpackHot.addDisposeHandler(() => {
          window.removeEventListener("beforeunload", this.unload)
          Object.assign(window, {
            overlayWindowControls: undefined
          })

          // ipcEventHandlers.forEach(([type, handler]) => {
          //   ipcRenderer.off(OverlayClientEventTypeToIPCName(type), handler)
          // })
        })
      }
    }
  }

  /**
   * Service constructor
   *
   */
  constructor() {}
}

export default OverlayWindowControls
