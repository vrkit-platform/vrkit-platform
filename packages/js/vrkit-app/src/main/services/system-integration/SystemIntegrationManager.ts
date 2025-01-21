import { getLogger } from "@3fv/logger-proxy"
import { PostConstruct, Singleton } from "@3fv/ditsy"
import AutoLaunch from "auto-launch"
import { app } from "electron"

import { Bind, Disposables, isEqual } from "@vrkit-platform/shared"
import { AppSettings } from "@vrkit-platform/models"
import PQueue from "p-queue"
import { reaction, toJS } from "mobx"
import SharedAppState from "../store"
import { AppSettingsService } from "../app-settings"

// noinspection TypeScriptUnresolvedVariable
const log = getLogger(__filename)
// noinspection JSUnusedLocalSymbols
const { debug, trace, info, error, warn } = log

@Singleton()
export class SystemIntegrationManager {
  readonly #disposers_ = new Disposables()
  readonly #systemQueue_ = new PQueue({
    concurrency: 1
  })

  readonly #autoLauncher = new AutoLaunch({
    name: app.getName()
  })

  get state() {
    return this.sharedAppState.appSettings
  }

  /**
   * Resource cleanup
   */
  [Symbol.dispose]() {
    this.#disposers_.dispose()
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
  protected async init() {
    this.#disposers_.push(
      reaction(
        () => toJS(this.sharedAppState.appSettings),
        () => this.onStateChange(),
        { equals: isEqual }
      )
    )

    await this.runSystemIntegrationTask(this.sharedAppState.appSettings)

    if (import.meta.webpackHot) {
      import.meta.webpackHot.addDisposeHandler(() => {
        this.unload()
      })
    }
  }

  private runSystemIntegrationTask(appSettings: AppSettings) {
    return this.#systemQueue_.add(this.updateSystemIntegrationTask(appSettings))
  }

  private updateSystemIntegrationTask(appSettings: AppSettings) {
    return async () => {
      try {
        const isEnabled = await this.#autoLauncher.isEnabled(),
          isConfigured = appSettings.openAppOnBoot

        log.info(`AutoLaunch(on=${isConfigured},alreadyEnabled=${isEnabled})`)
        if (isConfigured && !isEnabled) {
          log.info(`AutoLaunch Enabling`)
          await this.#autoLauncher.enable()
        } else if (!isConfigured && isEnabled) {
          log.info(`AutoLaunch Disabling`)
          await this.#autoLauncher.disable()
        }
      } catch (err) {
        log.error(`Unable to configure auto launch properly`, err)
      }
    }
  }

  /**
   * On state change, emit to renderers
   *
   * @param _change
   */
  @Bind
  private onStateChange() {
    this.#systemQueue_.add(this.updateSystemIntegrationTask({ ...this.appSettings }))
  }

  /**
   * Constructor for singleton
   *
   * @param sharedAppState
   */
  constructor(
    readonly sharedAppState: SharedAppState,
    readonly appSettingsService: AppSettingsService
  ) {}

  private get appSettings() {
    return this.sharedAppState.appSettings
  }
}

export default SystemIntegrationManager
