import { match, P } from "ts-pattern"


const log = console


function testMatch(isLive, activeSessionTypeIn, isAvailable, autoconnect) {
  const req = {
    isLive,
    activeSessionType: activeSessionTypeIn,
    isAvailable,
    autoconnect
  }
  let activeSessionType = activeSessionTypeIn
  
  match([isLive, activeSessionType, isAvailable, autoconnect])
    .with([true, "NONE", true, true], () => {
      activeSessionType = "LIVE"
    })
    .with([true, "LIVE", false, P._], () => {
      activeSessionType = "NONE"
    })
    .with([false, "DISK", false, P._], () => {
      activeSessionType = "NONE"
    })
    .with([false, "LIVE", false, P._], () => {
      activeSessionType = "NONE"
    })
    .otherwise(() => {
      // NO STATE CHANGE HERE
    })
  
  return activeSessionType
}

const cases =[]
cases.push(
    [[true, "NONE", true, true],"LIVE"],
    [[true, "LIVE", false], "NONE"],
    [[false, "DISK", false],"NONE"],
    [[false, "LIVE", false], "NONE"]
)

cases.forEach(([args, expectedRes]) => {
  //log.info(`Pair`, pair)
  const res = testMatch(...args)
  log.assert(res === expectedRes, `RES=${res},EXPECTED=${expectedRes}`)
  
  // if (res !== expectedRes) {
  //
  // } else {
  //   log.debug(`RES=${res},EXPECTED=${expectedRes}`)
  // }
})