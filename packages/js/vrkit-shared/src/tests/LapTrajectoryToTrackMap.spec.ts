import { LapTrajectory } from "vrkit-models"
import Fixtures, { readMessage } from "./DataFixtures"
import { getLogger } from "@3fv/logger-proxy"
import { LapTrajectoryConverter } from "../tools/track-map"

const log = getLogger(__filename)

test("Generate trackmap from trajectory", async () => {
  const trajectoryFile = Fixtures.resolveFile(Fixtures.Files.trajectory.RoadAmerica)
  const trajectory = await readMessage<LapTrajectory>(trajectoryFile, LapTrajectory)

  const converter = new LapTrajectoryConverter(20)
  const trackMap = converter.toTrackMap(trajectory)
  expect(trackMap).toBeDefined()
})
export {}
