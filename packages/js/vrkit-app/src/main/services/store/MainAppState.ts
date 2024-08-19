import { Deferred } from "@3fv/deferred"
import { PostConstruct, Singleton } from "@3fv/ditsy"
import { getLogger } from "@3fv/logger-proxy"
import { applyDecorators, Bind, Once } from "vrkit-app-common/decorators"
import { AppSettings, appSettingsSchema, ThemeId } from "vrkit-app-common/models"
import { cloneDeep, isNotEmpty, once } from "vrkit-app-common/utils"
import { promises as FsAsync } from "fs"
import { pick, throttle } from "lodash"
import { action, makeObservable, observable, toJS } from "mobx"
import { deepObserve, IDisposer } from "mobx-utils"
import PQueue from "p-queue"
import { IMainAppState, mainAppStateSchema } from "../../models"
import {
  fileExists,
  FileStorage,
  getAppThemeFromSystem,
  readJSONFile,
  readObjectFile
} from "../../utils"

const log = getLogger(__filename)

const { debug, trace, info, error, warn } = log
const BindAction = () => applyDecorators(Bind, action)

const [mainStateSchema, mainStateFile] = FileStorage.files.state
const [, acceleratorFile] = FileStorage.files.accelerators

@Singleton()
export class MainAppState implements AppSettings, IMainAppState {
  private initDeferred: Deferred<MainAppState>


  private stopObserving: IDisposer

  private shutdownInProgress: boolean = false

  @observable zoomFactor: number = 1.0

  @observable customAccelerators: Record<string, string> = {}

  @observable theme: ThemeId = null

  @observable systemTheme: ThemeId = getAppThemeFromSystem()

  /**
   * Get app settings from state
   */
  get appSettings() {
    return cloneDeep(
      toJS(pick(this, ["theme", "zoomFactor", "customAccelerators"]))
    ) as AppSettings
    // {
    //   theme: this.theme,
    //   zoomFactor: this.zoomFactor,
    //   customAccelerators: {
    //     ...this.customAccelerators
    //   }
    // } as AppSettings
  }

  get isShutdownInProgress() {
    return this.shutdownInProgress
  }

  constructor() {
    this.init().catch(err => {
      error(`Failed to init store`, err)
    })
  }

  @Bind
  private onChange() {
    if (this.shutdownInProgress) {
      warn("Shutdown in progress, ignoring change")
      return
    }
    MainAppState.save(this)
  }

  @Once()
  private async init() {
    if (this.initDeferred) {
      return this.initDeferred.promise
    }
    this.initDeferred = new Deferred<MainAppState>()
    try {
      if (await fileExists(mainStateFile)) {
        info(`Loading main store state from: ${mainStateFile}`)

        try {
          const loadedState =
            await readObjectFile(mainStateFile, mainAppStateSchema)

          this.customAccelerators = (await fileExists(acceleratorFile).then(
            exists =>
              exists ? readJSONFile(acceleratorFile) : Promise.resolve({})
          )) as any

          Object.assign(this, loadedState)
        } catch (err) {
          warn(
            `Unable to restore state from (${mainStateFile}), initializing from scratch`,
            err
          )
        }
      } else {
        info(`Main state file did not exist @ launch: %s`, mainStateFile)
      }
      makeObservable(this)
      const unsubscribe = (this.stopObserving = deepObserve(
        this,
        this.onChange
      ))
      if (module.hot) {
        module.hot.addDisposeHandler(() => {
          warn(`HMR removing observer`)
          unsubscribe()
        })
      }

      this.initDeferred.resolve(this)
    } catch (err) {
      error(`init failed`, err)
      this.initDeferred.reject(err)
    }

    return this
  }

  setShutdownInProgress(shutdownInProgress: boolean = true) {
    this.shutdownInProgress = shutdownInProgress
    this.stopObserving()
  }

  @Bind
  @PostConstruct()
  whenReady() {
    return this.initDeferred.promise
  }

  @BindAction() setZoomFactor(zoomFactor: number) {
    this.zoomFactor = zoomFactor
  }

  @BindAction() setTheme(theme: ThemeId) {
    this.theme = theme
  }

  @BindAction() setSystemTheme(theme: ThemeId) {
    this.systemTheme = theme
  }

  @BindAction() setAppSettings(settings: AppSettings) {
    Object.assign(this, settings)
  }

  private static persistenceQueue = new PQueue({
    concurrency: 1
  })

  static saveImmediate(state: MainAppState) {
    if (state.shutdownInProgress) {
      warn("Shutdown in progress, skipping save")
      return
    }

    const bytes = FileStorage.serializeData(mainStateSchema, toJS(state))

    return MainAppState.persistenceQueue.add(() =>
      FsAsync.writeFile(mainStateFile, bytes)
        .then(() => {
          info(`Wrote main store state (${mainStateFile})`)
        })
        .catch(err => {
          error(`Unable to persist main store state (${mainStateFile})`, err)
        })
    )
  }

  static readonly save = throttle(MainAppState.saveImmediate, 300)
}

const instanceDeferred = new Deferred<MainAppState>()

/**
 * Get main state store if it's been resolved
 *
 * @returns singleton store
 */
export function getMainStateStore() {
  if (instanceDeferred.isRejected()) {
    throw instanceDeferred.getError()
  } else if (instanceDeferred.isFulfilled()) {
    return instanceDeferred.getResult()
  } else {
    return null
  }
}

/**
 * Async factory for main state store
 */
export const createMainStateStore = once(async () => {
  const store = new MainAppState()
  await store.whenReady().then(
    () => instanceDeferred.resolve(store),
    err => {
      instanceDeferred.reject(err)
      throw err
    }
  )
  return store
})
