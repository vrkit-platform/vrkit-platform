import { pick } from "lodash"
import Two from "two.js"
import type TTwo from "two.js"
import type { LapTrajectory, TrackMap } from "vrkit-models"
import "vrkit-plugin-sdk"
import { ScaleTrackMapToFit } from "vrkit-shared"

const rootEl = document.getElementById("root") as HTMLElement,
    canvasEl = document.createElement('canvas')


rootEl.appendChild(canvasEl)

let trackMap: TrackMap = null

let two = null as any

let trackPath: any = null

function renderTrack() {
  
  const {clientWidth: width, clientHeight: height} = rootEl
  if (!width || !height) {
    console.warn("Unable to render canvas, width & height must be positive values", {width, height})
    return
  }
  
  console.info("renderTrack()", width, height)
  
  // if (trackPath) {
  //   two.remove(trackPath)
  //   trackPath = null
  // }
  
  canvasEl.width = width
  canvasEl.height = height
  Object.assign(canvasEl.style, {
    width: `${width}px`,
    height: `${height}px`,
    background: 'transparent'
  })
  
  if (two) {
    two.clear()
    two = null
  }
  
  two = new Two({
    fitted: true,
    width,
    height,
    domElement: canvasEl,
    autostart: true,
  })
  
  const scaledTrackMap = ScaleTrackMapToFit(trackMap, {width, height})
  const trackPathAnchors = scaledTrackMap.path.map(coord => new Two.Anchor(
      coord.x,coord.y
  ))
  
  const trackPath = new Two.Path(trackPathAnchors, true)
  trackPath.stroke = "red"
  two.add(trackPath)
}

const sizeObserver = new ResizeObserver((entries:ResizeObserverEntry[]) => {
  for (let entry of entries) {
    if (entry?.target !== rootEl) {
      console.warn("Received unknown element resize entry", entry)
      continue
    }
    
    renderTrack()
  }
})

function renderSetup() {
  sizeObserver.observe(rootEl, {
    box: "border-box"
  })
  
  renderTrack()
}

async function launch() {
  const
      client = getVRKitPluginClient(),
      overlayInfo = client.getOverlayInfo(),
      sessionInfo = await client.fetchSessionInfo(),
      weekendInfo = sessionInfo.weekendInfo,
      {trackID: trackId, trackName, trackConfigName} = pick(weekendInfo, "trackID","trackName","trackConfigName"),
      trackLayoutId = `${trackId}::${trackName}::${trackConfigName === "null" ? "NO_CONFIG_NAME" : trackConfigName}`
  
  trackMap = await client.getTrackMap(trackLayoutId)
  
  // console.log(`Trajectory for ${trackLayoutId}`, trackMap)
  //rootEl.innerHTML = `Track map goes here: trackId=${trackId},trackName=${trackName},trackConfigName=${trackConfigName} --- trackLayoutId=${trackLayoutId}`
  renderSetup()
}

export default launch()