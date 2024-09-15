import { getLogger } from "@3fv/logger-proxy"
import { pick, throttle } from "lodash"
import type { Path as TwoPath } from "two.js/src/path"
import type { Vector as TwoVector } from "two.js/src/vector"
import type { Shape as TwoShape } from "two.js/src/shape"
import Two from "two.js"
import type { OverlayBaseSettings, OverlayInfo, SessionDataVariableValueMap, TrackMap } from "vrkit-models"
import "vrkit-plugin-sdk"
import { PluginClient, PluginClientEventType, SessionInfoMessage } from "vrkit-plugin-sdk"
import { ScaleTrackMapToFit } from "vrkit-shared"
import { Noop } from "vrkit-app-common/utils"
import { asOption } from "@3fv/prelude-ts"
import { get } from "lodash/fp"
import { isDefined } from "@3fv/guard"

const TrackMapThrottlingPeriod = 100,
  CarMarkerRadiusPx = 6,
  log = getLogger(__filename),
  contentEl = document.getElementById("content") as HTMLElement,
  canvasEl = document.createElement("canvas")

contentEl.appendChild(canvasEl)

let client: PluginClient = null
let overlayInfo: OverlayInfo = null
let sessionInfo: SessionInfoMessage = null

let trackMap: TrackMap = null

const patchSceneState = (patch: Partial<SceneState>): SceneState =>
  Object.assign(sceneState, {
    ...patch
  })

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

const carDataMap = new Map<number, CarData>()

interface CarMarker {
  idx: number

  data: CarData

  vector: TwoVector

  shape: TwoShape
}

interface SceneState {
  two?: Two

  trackPath?: TwoPath

  carMarkers: CarMarker[]

  width: number

  height: number
}

const sceneState: SceneState = {
  carMarkers: [],
  width: contentEl.clientWidth,
  height: contentEl.clientHeight
}

type RenderCarsFn = (cars: CarData[]) => void

function makeRenderCars(settings: OverlayBaseSettings): RenderCarsFn {
  const fps = settings?.fps ?? 10
  return (//throttle(
    (carsData: CarData[]) => {
      log.debug(`Rendering cars (count=${carsData.length})`)

      let { two, trackPath } = sceneState
      if (!two || !trackPath) {
        log.warn(`Scene state is not ready to render cars`, sceneState)
        return
      }

      const dataIdxList = carsData.map(get("idx"))

      const carMarkers = (sceneState.carMarkers = sceneState.carMarkers
        .map(marker => {
          if (dataIdxList.includes(marker.idx)) {
            return marker
          }

          marker.shape?.remove()
          return null as CarMarker
        })
        .filter(isDefined))

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
    })
  //   ,
  //   Math.ceil(1000 / fps)
  // )
}

/**
 * FPS driven car update
 */
let renderCars: RenderCarsFn = Noop()

/**
 * Render the track map
 */
const createScene = throttle(() => {
  const { clientWidth: width, clientHeight: height } = contentEl
  if (!width || !height) {
    log.warn("Unable to render canvas, width & height must be positive values", { width, height })
    return
  }

  log.info("renderTrack()", width, height)

  canvasEl.width = width
  canvasEl.height = height
  Object.assign(canvasEl.style, {
    width: `${width}px`,
    height: `${height}px`,
    background: "transparent"
  })
  
  if (sceneState.two) {
    sceneState.two.clear()
    sceneState.two = null
  }
  
  Object.assign(sceneState, {
    width,
    height,
    carMarkers: []
  })

  const two = (sceneState.two = new Two({
    fitted: true,
    width,
    height,
    domElement: canvasEl,
    autostart: false
  }))
  

  const scaledTrackMap = ScaleTrackMapToFit(trackMap, { width, height })
  const trackPathAnchors = scaledTrackMap.path.map(coord => new Two.Anchor(coord.x, coord.y))
  const trackPath = (sceneState.trackPath = global.trackPath = new Two.Path(trackPathAnchors, true))

  Object.assign(trackPath, {
    stroke: "red",
    fill: "transparent"
  })

  // trackPath.stroke = "red"
  // trackPath.fill = "transparent"
  two.add(trackPath)
}, TrackMapThrottlingPeriod)

/**
 * A ResizeObserver instance that monitors resize events for elements.
 * The observer listens for resize entries and performs actions based on
 * the observed elements.
 *
 * If the observed element matches a specified root element (`rootEl`), the
 * `renderTrack` function is called.
 *
 * If the observed element does not match the root element, a warning log is
 * generated.
 *
 * @param entries An array of ResizeObserverEntry objects containing information
 * about the observed resize events.
 * @throws Logs a warning message if an unknown element is resized.
 */
const sizeObserver = new ResizeObserver(
  throttle(
    (entries: ResizeObserverEntry[]) => {
      for (let entry of entries) {
        if (entry?.target !== contentEl) {
          log.warn("Received unknown element resize entry", entry)
          continue
        }

        createScene()
      }
    },
    TrackMapThrottlingPeriod,
    {
      trailing: true
    }
  )
)

// FLAG MARKING WHETHER SETUP HAS ALREADY RUN
let setupComplete = false

/**
 * Setup the scene for rendering
 *
 * @param newInfo
 */
function renderSetup(newInfo: OverlayInfo = overlayInfo) {
  renderCars = makeRenderCars(newInfo?.settings)

  if (!setupComplete)
    sizeObserver.observe(contentEl, {
      box: "border-box"
    })
  setupComplete = true

  createScene()
}

function updateSessionInfo(info: SessionInfoMessage) {
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

    const existingData = carDataMap.get(driver.carIdx)
    if (existingData) {
      Object.assign(existingData, newData)
    } else {
      carDataMap.set(driver.carIdx, newData)
    }
  }
}

function updateCars(dataVarValues: SessionDataVariableValueMap) {
  if (carDataMap.size === 0) {
    log.warn("Can not update cars because car info has not been set yet")
    return
  }

  const pendingCarData = Array<CarData>()
  carDataMap.forEach((data, idx) => {
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

  renderCars(pendingCarData)
}

async function launch() {
  client = getVRKitPluginClient()
  overlayInfo = client.getOverlayInfo()
  sessionInfo = await client.fetchSessionInfo()

  const weekendInfo = sessionInfo.weekendInfo,
    { trackID: trackId, trackName, trackConfigName } = pick(weekendInfo, "trackID", "trackName", "trackConfigName"),
    trackLayoutId = `${trackId}::${trackName}::${trackConfigName === "null" ? "NO_CONFIG_NAME" : trackConfigName}`

  trackMap = await client.getTrackMap(trackLayoutId)

  const onSessionInfo = (sessionId, info) => {
    // log.debug("SESSION_INFO EVENT", sessionId, info)
    updateSessionInfo(info)
  }

  const onDataFrame = (sessionId, timing, dataVarValues) => {
    log.debug("DATA_FRAME EVENT", sessionId, timing.currentTimeMillis, "DATA VAR VALUE COUNT = ", dataVarValues.length)
    updateCars(dataVarValues)
  }

  client.on(PluginClientEventType.SESSION_INFO, onSessionInfo)
  client.on(PluginClientEventType.DATA_FRAME, onDataFrame)

  if (import.meta.webpackHot) {
    import.meta.webpackHot.addDisposeHandler(() => {
      client.off(PluginClientEventType.SESSION_INFO, onSessionInfo)
      client.off(PluginClientEventType.DATA_FRAME, onDataFrame)
    })
  }

  renderSetup()
}

export default launch()
