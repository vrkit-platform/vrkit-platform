import { pick } from "lodash"
import "vrkit-plugin-sdk"

async function launch() {
  const rootEl = document.getElementById("root") as HTMLElement,
      client = getVRKitPluginClient(),
      overlayInfo = client.getOverlayInfo(),
      sessionInfo = await client.fetchSessionInfo(),
      weekendInfo = sessionInfo.weekendInfo,
      {trackID: trackId, trackName, trackConfigName} = pick(weekendInfo, "trackID","trackName","trackConfigName"),
      trackLayoutId = `${trackId}::${trackName}::${trackConfigName === "null" ? "NO_CONFIG_NAME" : trackConfigName}`,
      trajectory = await client.getLapTrajectory(trackLayoutId)
  
  console.log(`Trajectory for ${trackLayoutId}`, trajectory)
  rootEl.innerHTML = `Track map goes here: trackId=${trackId},trackName=${trackName},trackConfigName=${trackConfigName} --- trackLayoutId=${trackLayoutId}`
}

export default launch()