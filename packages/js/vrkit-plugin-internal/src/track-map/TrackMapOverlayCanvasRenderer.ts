import { getLogger } from "@3fv/logger-proxy"
import { pick, throttle } from "lodash"
import type { Path as TwoPath } from "two.js/src/path"
import type { Vector as TwoVector } from "two.js/src/vector"
import type { Shape as TwoShape } from "two.js/src/shape"
import Two from "two.js"
import type { OverlayBaseSettings, OverlayInfo, SessionDataVariableValueMap, TrackMap } from "@vrkit-platform/models"
import { IPluginClient, PluginClientEventType, SessionInfoMessage } from "@vrkit-platform/plugin-sdk"
import { assign, Bind, Noop, ScaleTrackMapToFit } from "@vrkit-platform/shared"
// @ts-ignore
import { asOption } from "@3fv/prelude-ts"
import { get } from "lodash/fp"
import { isDefined } from "@3fv/guard"
import { Deferred } from "@3fv/deferred"

const TrackMapThrottlingPeriod = 500,
  CarMarkerRadiusPx = 6,
  log = getLogger(__filename)

interface CarData {
  idx: number // from info
  id: number

  username: string // from info
  carNumber: string // from info
  lap: number // CarIdxLap
  lapCompleted: number // CarIdxLapCompleted
  lapPercentComplete: number // CarIdxLapDistPct
  position: number // CarIdxPosition
  classPosition: number // CarIdxClassPosition
}

interface CarMarker {
  idx: number

  data: CarData

  vector: TwoVector

  shape: TwoShape
}

interface SceneState {
  two?: Two

  trackPath?: TwoPath

  overlayInfo?: OverlayInfo

  sessionInfo?: SessionInfoMessage

  width?: number

  height?: number

  // canvasEl?: HTMLCanvasElement

  trackMap?: TrackMap

  client: IPluginClient

  carMarkers: CarMarker[]

  carDataMap: Map<number, CarData>

  // FLAG MARKING WHETHER SETUP HAS ALREADY RUN
  setupComplete: boolean
}

const newSceneState = (width: number, height: number): SceneState => ({
  carMarkers: [],
  carDataMap: new Map<number, CarData>(),
  client: getVRKitPluginClient(),
  width,
  height,

  // FLAG MARKING WHETHER SETUP HAS ALREADY RUN
  setupComplete: false
})

type RenderCarsFn = (cars: CarData[]) => void

class TrackMapOverlayCanvasRenderer {
  /**
   * Initialization deferred promise
   *
   * @private
   */
  private initializeDeferred = new Deferred<void>()

  /**
   * Renderer internal state
   *
   * @private
   */
  private state: SceneState = null

  /**
   * Patch the state
   *
   * @param patch
   * @returns {SceneState}
   */
  private patchSceneState(patch: Partial<SceneState>): SceneState {
    this.state = { ...this.state, ...patch }
    return this.state
  }

  /**
   * FPS driven car update
   */
  private renderCars_: RenderCarsFn = Noop()

  /**
   * Retrieve the render cars function
   */
  get renderCars() {
    if (!this.renderCars_) {
      this.renderCars_ = this.makeRenderCars(this.state.overlayInfo?.settings)
    }

    return this.renderCars_
  }

  /**
   * Check if the renderer has been initialized
   * @private
   */
  private get isInitialized() {
    return this.initializeDeferred?.isFulfilled() ?? false
  }
  
  /**
   * Create car records for rendering
   *
   * @param settings
   * @private
   */
  private makeRenderCars(settings: OverlayBaseSettings = null): RenderCarsFn {
    const fps = settings?.fps ?? 60
    return throttle(
      (carsData: CarData[]) => {
        try {
          if (!this.isInitialized) {
            log.warn("Not initialized")
            return
          }

          const sceneState = this.state
          log.debug(`Rendering cars (count=${carsData.length})`)

          let { two, trackPath } = sceneState
          if (!two || !trackPath) {
            log.warn(`Scene state is not ready to render cars`, sceneState)
            return
          }

          const dataIdxList = carsData.map(get("idx")),
            updatedCarMarkers = sceneState.carMarkers
              .map(marker => {
                if (dataIdxList.includes(marker.idx)) {
                  return marker
                }

                marker.shape?.remove()
                return null as CarMarker
              })
              .filter(isDefined),
            { carMarkers } = this.patchSceneState({
              carMarkers: updatedCarMarkers
            })

          for (let carData of carsData) {
            const carMarker = asOption(carMarkers.find(marker => marker.idx === carData.idx)).getOrCall(
              () =>
                (carMarkers[carMarkers.length] = {
                  idx: carData.idx,
                  data: carData,
                  vector: null,
                  shape: null
                })
            )

            carMarker.vector = trackPath.getPointAt(carData.lapPercentComplete)

            if (!carMarker.shape) {
              two.add((carMarker.shape = new Two.Circle(carMarker.vector.x, carMarker.vector.y, CarMarkerRadiusPx)))
            } else {
              carMarker.shape.position = carMarker.vector
            }
          }

          two.update()
        } catch (err) {
          log.error("render cars failed", err)
        }
      },
      Math.ceil(1000 / fps)
    )
  }

  /**
   * Render the track map
   */
  private createScene() {
    try {
      if (!this.isInitialized) {
        log.warn("Not initialized, can not createScene")
        return
      }

      const { width, height } = this.state,
        { trackMap } = this.state

      if (!this.canvasEl || !width || !height || !trackMap) {
        log.warn(
          "Unable to render canvas, canvas element, width & height must be positive values",
          { width, height },
          "track map",
          trackMap
        )
        return
      }

      log.info("renderTrack()", width, height)

      Object.assign(this.canvasEl.style, {
        width: `${width}px`,
        height: `${height}px`,
        background: "transparent",
        objectFit: "contain"
      })

      const statePatch: Partial<SceneState> = {
          width,
          height,
          two: asOption(this.state.two)
            .ifSome(t => {
              t.width = width
              t.height = height
            })
            .getOrCall(
              () =>
                new Two({
                  width,
                  height,
                  domElement: this.canvasEl,
                  autostart: false,
                  smoothing: false,
                  overdraw: false
                })
            )
        },
        two = statePatch.two,
        scaledTrackMap = ScaleTrackMapToFit(
          trackMap,
          { width, height },
          {
            padding: 10
          }
        ),
        trackPathAnchors = scaledTrackMap.path.map(coord => new Two.Anchor(coord.x, coord.y))

      asOption(this.state.trackPath).match({
        Some: tp => {
          tp.vertices = trackPathAnchors
        },
        None: () => {
          const tp = (statePatch.trackPath = new Two.Path(trackPathAnchors, true))
          Object.assign(tp, {
            stroke: "red",
            fill: "transparent"
          })

          two.add(tp)
        }
      })

      this.patchSceneState(statePatch)
    } catch (err) {
      log.error("createScene failed", err)
    }
  }

  /**
   * Updates the driver info data & session info (Practice, Quali, Race)
   *
   * @param info
   * @private
   */
  private updateSessionInfo(info: SessionInfoMessage) {
    try {
      if (!this.isInitialized) {
        log.warn("Not initialized")
        return
      }
      const drivers = info?.driverInfo?.drivers
      if (!drivers) {
        return
      }

      for (let driver of Object.values(drivers)) {
        const newData: CarData = {
            id: driver.carID,
            idx: driver.carIdx,
            carNumber: driver.carNumber,
            username: driver.userName,
            lap: 0,
            lapCompleted: 0,
            classPosition: 0,
            position: 0,
            lapPercentComplete: 0.0
          },
          { carDataMap } = this.state,
          existingData = carDataMap.get(driver.carIdx)

        if (existingData) {
          Object.assign(existingData, newData)
        } else {
          carDataMap.set(driver.carIdx, newData)
        }
      }
    } catch (err) {
      log.error("updateSessionInfo failed", err)
    }
  }

  get carDataMap() {
    return this.state.carDataMap
  }

  /**
   * Update the state (position, lap, lap times, etc) triggered via a data frame
   *
   * @param dataVarValues
   * @private
   */
  private updateCars(dataVarValues: SessionDataVariableValueMap) {
    try {
      if (!this.isInitialized) {
        log.warn("Not initialized yet")
        return
      }

      if (this.carDataMap.size === 0) {
        log.warn("Can not update cars because car info has not been set yet")
        return
      }

      const pendingCarData = Array<CarData>()
      this.carDataMap.forEach((data, idx) => {
        Object.assign(data, {
          lap: dataVarValues["CarIdxLap"].values[idx] ?? -1,
          lapCompleted: dataVarValues["CarIdxLapCompleted"].values[idx] ?? -1,
          lapPercentComplete: dataVarValues["CarIdxLapDistPct"].values[idx] ?? -1,
          position: dataVarValues["CarIdxPosition"].values[idx] ?? -1,
          classPosition: dataVarValues["CarIdxClassPosition"].values[idx] ?? -1
        })

        if (data.lap > -1) {
          pendingCarData.push(data)
        }
      })

      this.renderCars(pendingCarData)
    } catch (err) {
      log.error(`Failed to update Cars`, err)
    }
  }

  /**
   * Handler for DATA_FRAME events
   *
   * @param sessionId
   * @param timing
   * @param dataVarValues
   * @private
   */
  @Bind
  private onDataFrame(sessionId, timing, dataVarValues) {
    if (!this.isInitialized || !dataVarValues) {
      return
    }
    try {
      // log.debug("DATA_FRAME EVENT", sessionId, timing.currentTimeMillis,
      // "DATA VAR VALUE COUNT = ", dataVarValues.length)
      this.updateCars(dataVarValues)
    } catch (err) {
      log.error(`Unable to process data frame`, err)
    }
  }

  /**
   * Handler for session info events
   *
   * @param sessionId
   * @param info
   * @private
   */
  @Bind
  private onSessionInfo(sessionId, info) {
    try {
      this.updateSessionInfo(info)
    } catch (err) {
      log.error(info)
    }
  }

  private async initializeState() {
    const deferred = this.initializeDeferred
    if (!deferred) {
      log.warn("Deferred is null, this has likely been destroyed")
      return
    }

    if (deferred.isSettled()) {
      log.warn("Deferred is already settled, skipping and returning same result")
      return deferred.promise
    }

    try {
      const { state } = this,
        { client } = state,
        { sessionInfo } = assign(state, {
          overlayInfo: client.getOverlayInfo(),
          sessionInfo: client.getSessionInfo()
        }),
        weekendInfo = sessionInfo.weekendInfo,
        { trackID: trackId, trackName, trackConfigName } = pick(weekendInfo, "trackID", "trackName", "trackConfigName"),
        trackLayoutId = `${trackId}::${trackName}::${
          !trackConfigName || trackConfigName === "null" ? "NO_CONFIG_NAME" : trackConfigName
        }`

      state.trackMap = await client.getTrackMap(trackLayoutId)

      this.patchSceneState(state)

      deferred.resolve()
      this.createScene()

      // ATTACH LISTENERS
      client.on(PluginClientEventType.SESSION_INFO_CHANGED, this.onSessionInfo)
      client.on(PluginClientEventType.DATA_FRAME, this.onDataFrame)

      asOption(client.getSessionInfo()).ifSome(info => {
        this.updateSessionInfo(info)
      })
    } catch (err) {
      deferred.reject(err)
    }

    return deferred.promise
  }

  constructor(
    readonly canvasEl: HTMLCanvasElement,
    width: number,
    height: number
  ) {
    this.reset(width, height)
  }

  setSize(width: number, height: number) {
    try {
      if (this.state.width !== width || this.state.height !== height) {
        this.reset(width, height)
      }
    } catch (err) {
      log.error("Failed to set size", err)
    }
  }

  clear() {
    try {
      Two.Instances.forEach((t: Two) => {
        t.clear()
      })

      this.canvasEl?.replaceChildren()
    } catch (err) {
      log.error("Failed to clear", err)
    }
  }

  reset(width: number, height: number) {
    try {
      this.clear()

      const client = getVRKitPluginClient()
      client.off(PluginClientEventType.SESSION_INFO_CHANGED)
      client.off(PluginClientEventType.DATA_FRAME)

      this.initializeDeferred = new Deferred()

      this.state = newSceneState(width, height)

      this.initializeState()
        .then(() => {
          log.info(`Initialize state completed, rendering`)
        })
        .catch(err => {
          log.error(`failed to initialize state`, err)
        })
    } catch (err) {
      log.error("Failed to reset", err)
    }
  }

  destroy() {
    try {
      const client = getVRKitPluginClient()
      client.off(PluginClientEventType.SESSION_INFO_CHANGED)
      client.off(PluginClientEventType.DATA_FRAME)

      this.clear()
      this.initializeDeferred = null
      this.state = null
    } catch (err) {
      log.error("Failed to destroy", err)
    }
  }
}

export default TrackMapOverlayCanvasRenderer
