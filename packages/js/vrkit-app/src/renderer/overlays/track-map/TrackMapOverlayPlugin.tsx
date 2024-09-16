import { getLogger } from "@3fv/logger-proxy"
import { pick, throttle } from "lodash"
import type { Path as TwoPath } from "two.js/src/path"
import type { Vector as TwoVector } from "two.js/src/vector"
import type { Shape as TwoShape } from "two.js/src/shape"
import Two from "two.js"
import type { OverlayBaseSettings, OverlayInfo, SessionDataVariableValueMap, TrackMap } from "vrkit-models"
import "vrkit-plugin-sdk"
import { PluginClient, PluginClientComponentProps, PluginClientEventType, SessionInfoMessage } from "vrkit-plugin-sdk"
import { ScaleTrackMapToFit } from "vrkit-shared"
import { assign, Noop } from "vrkit-app-common/utils"
import { asOption } from "@3fv/prelude-ts"
import { get } from "lodash/fp"
import { isDefined } from "@3fv/guard"
import React, { useEffect } from "react"
import { Deferred } from "@3fv/deferred"
import { Bind } from "vrkit-app-common/decorators"

const TrackMapThrottlingPeriod = 100,
  CarMarkerRadiusPx = 6,
  log = getLogger(__filename)
//  contentEl = document.getElementById("content") as HTMLElement

//   canvasEl = document.createElement("canvas")
//
// contentEl.appendChild(canvasEl)

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

  client: PluginClient

  carMarkers: CarMarker[]

  carDataMap: Map<number, CarData>

  // FLAG MARKING WHETHER SETUP HAS ALREADY RUN
  setupComplete: boolean
}

const newSceneState = (): SceneState => ({
  carMarkers: [],
  carDataMap: new Map<number, CarData>(),
  client: getVRKitPluginClient(),
  width: 0,
  height: 0,

  // FLAG MARKING WHETHER SETUP HAS ALREADY RUN
  setupComplete: false
})

type RenderCarsFn = (cars: CarData[]) => void

class TrackMapOverlayPlugin extends React.Component<PluginClientComponentProps, SceneState> {
  private readonly initializeDeferred = new Deferred<void>()

  private mounted: boolean = false

  // private get canvasEl(): HTMLCanvasElement {
  //   return this.state?.canvasEl
  // }
  //
  // private get canvasEl() {
  //   return this.canvasRef?.current
  // }
  
  private canvasEl: HTMLCanvasElement = null
  
  /**
   * FPS driven car update
   */
  private renderCars: RenderCarsFn = Noop()

  private get isInitialized() {
    return this.initializeDeferred.isFulfilled()
  }

  private patchSceneState(patch: Partial<SceneState>): SceneState {
    this.setState(prevState => ({ ...prevState, ...patch }))
    return this.state
  }

  private makeRenderCars(settings: OverlayBaseSettings): RenderCarsFn {
    const fps = settings?.fps ?? 10
    return (
      //throttle(
      (carsData: CarData[]) => {
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

        two.render()
      }
    )
    //   ,
    //   Math.ceil(1000 / fps)
    // )
  }

  /**
   * Render the track map
   */
  createScene = throttle(() => {
    const { width, height } = this.props,
        {trackMap} = this.state

    if (!this.canvasEl || !width || !height) {
      log.warn("Unable to render canvas, canvas element, width & height must be positive values", { width, height })
      return
    }

    log.info("renderTrack()", width, height)

    this.canvasEl.width = width
    this.canvasEl.height = height
    Object.assign(this.canvasEl.style, {
      width: `${width}px`,
      height: `${height}px`,
      background: "transparent"
    })

    if (this.state.two) {
      this.state.two.clear()
    }

    const statePatch:Partial<SceneState> = {
      width,
      height,
      carMarkers: [],
      two: new Two({
        fitted: true,
        width,
        height,
        domElement: this.canvasEl,
        autostart: false
      })
    }

    const two = statePatch.two

    const scaledTrackMap = ScaleTrackMapToFit(trackMap, { width, height })
    const trackPathAnchors = scaledTrackMap.path.map(coord => new Two.Anchor(coord.x, coord.y))
    const trackPath = (statePatch.trackPath = new Two.Path(trackPathAnchors, true))

    Object.assign(trackPath, {
      stroke: "red",
      fill: "transparent"
    })

    // trackPath.stroke = "red"
    // trackPath.fill = "transparent"
    two.add(trackPath)
    
    this.setState(prevState => ({...prevState, ...statePatch}))
  }, TrackMapThrottlingPeriod)

  updateSessionInfo(info: SessionInfoMessage) {
    const drivers = info?.driverInfo?.drivers
    // log.info("Drivers info", drivers)
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
      }

      const { carDataMap } = this.state,
        existingData = carDataMap.get(driver.carIdx)

      if (existingData) {
        Object.assign(existingData, newData)
      } else {
        carDataMap.set(driver.carIdx, newData)
      }
    }
  }

  get carDataMap() {
    return this.state.carDataMap
  }

  updateCars(dataVarValues: SessionDataVariableValueMap) {
    if (!this.mounted)
      return
    
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
      // lap: number // CarIdxLap
      // lapCompleted: number // CarIdxLapCompleted
      // lapPercentComplete: number // CarIdxLapDistPct
      // position: number // CarIdxPosition
      // classPosition: number // CarIdxClassPosition
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

    if (!this.renderCars) {
      this.renderCars = this.makeRenderCars(this.state.overlayInfo?.settings)
    }

    this.renderCars(pendingCarData)
  }
  
  onDataFrame = (sessionId, timing, dataVarValues) => {
    if (!this.isInitialized)
      return
    
    log.debug("DATA_FRAME EVENT",
        sessionId,
        timing.currentTimeMillis,
        "DATA VAR VALUE COUNT = ",
        dataVarValues.length
    )
    this.updateCars(dataVarValues)
  }
  
  onSessionInfo = (sessionId, info) => {
    this.updateSessionInfo(info)
  }
  
  private async initializeState() {
    try {
      const state = newSceneState(), { client } = state
      
      // newSceneState()
      const { sessionInfo } = assign(state, {
        overlayInfo: client.getOverlayInfo(),
        sessionInfo: await client.fetchSessionInfo()
      }),
          weekendInfo = sessionInfo.weekendInfo, {
            trackID: trackId,
            trackName,
            trackConfigName
          } = pick(weekendInfo, "trackID", "trackName", "trackConfigName"),
          trackLayoutId = `${trackId}::${trackName}::${trackConfigName ===
          "null" ? "NO_CONFIG_NAME" : trackConfigName}`
      
      state.trackMap = await client.getTrackMap(trackLayoutId)
      
      if (import.meta.webpackHot) {
        import.meta.webpackHot.addDisposeHandler(() => {
          client.off(PluginClientEventType.SESSION_INFO, this.onSessionInfo)
          client.off(PluginClientEventType.DATA_FRAME, this.onDataFrame)
        })
      }
      
      this.setState(state, () => {
        this.initializeDeferred.resolve()
        this.createScene()
        client.on(PluginClientEventType.SESSION_INFO, this.onSessionInfo)
        client.on(PluginClientEventType.DATA_FRAME, this.onDataFrame)
      })
    } catch (err) {
      this.initializeDeferred.reject(err)
    }
    // this.renderSetup()
  }

  @Bind
  private setCanvasEl(canvasEl: HTMLCanvasElement) {
    this.canvasEl = canvasEl
    // if (canvasEl !== this.state.canvasEl)
    //   this.setState({ canvasEl })
  }

  constructor(props: PluginClientComponentProps) {
    super(props)

    this.state = newSceneState()
  }

  updateState() {
    if (!this.mounted) {
      log.warn("Not mounted yet")
      return
    }

    if (this.isInitialized && this.canvasEl) {
      this.createScene()
      this.forceUpdate()
    }
  }
  componentWillUnmount(): void {
    this.mounted = false
  }

  componentDidMount(): void {
    this.mounted = true
    this.initializeState()
      .then(() => {
        log.info(`Initialize state completed, rendering`)
        this.updateState()
      })
      .catch(err => {
        log.error(`failed to initialize state`, err)
      })
  }

  componentDidUpdate(
    prevProps: Readonly<PluginClientComponentProps>,
    prevState: Readonly<SceneState>,
    snapshot?: any
  ): void {
    // if (this.isInitialized && (prevProps.width !== this.props.width || prevProps.height !== this.props.height))
    //   this.updateState()
  }

  render() {
    const { width, height } = this.props

    return <canvas ref={this.setCanvasEl}></canvas>
  }
}

export default TrackMapOverlayPlugin
