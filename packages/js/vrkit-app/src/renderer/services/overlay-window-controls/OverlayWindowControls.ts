import { getLogger } from "@3fv/logger-proxy"
import { PostConstruct, Singleton } from "@3fv/ditsy"
import { Bind } from "vrkit-app-common/decorators"
import { isDev } from "../../constants"
import "./OverlayWindowControls.scss"
import {
  OverlayClientEventType,
  OverlayMode,
  OverlayWindowMainEvents,
  OverlayWindowRendererEvents
} from "vrkit-app-common/models/overlay-manager"
import { ipcRenderer, IpcRendererEvent } from "electron"
import OverlayClient from "../overlay-client"

// noinspection TypeScriptUnresolvedVariable
const log = getLogger(__filename)

// noinspection JSUnusedLocalSymbols
const { debug, trace, info, error, warn } = log


const WinRendererEvents = OverlayWindowRendererEvents
const WinMainEvents = OverlayWindowMainEvents

@Singleton()
export class OverlayWindowControls {

  @Bind
  private async onEditBtnClick(event: Event) {
    // log.info(`onMouseEnter`)
    // body.classList.add("hover")
    // ipcRenderer.send(WinRendererEvents.EventTypeToIPCName(WinRendererEvents.EventType.MOUSE_ENTER))
    await this.client.setMode(OverlayMode.EDIT)
  }

  @Bind
  private onMainFocused(ev: IpcRendererEvent, enabled: boolean) {
    // Replace with event or redux
    // if (enabled)
    //   rootEl.classList.add("focus")
    // else
    //   rootEl.classList.remove("focus")
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

    // body.removeEventListener("mouseenter", this.onMouseEnter)
    // body.removeEventListener("mouseleave", this.onMouseLeave)
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
    
    this.client.on(OverlayClientEventType.OVERLAY_MODE,(newMode: OverlayMode) => {
      // TODO: Swap all this junk out for REACT
      // document.body.style.setProperty('overlay-edit-mode', 'true')
    })
    
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
        })
      }
    }
  }

  /**
   * Service constructor
   *
   */
  constructor(readonly client: OverlayClient) {}
}

export default OverlayWindowControls
