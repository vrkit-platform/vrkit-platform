// import "jest"
import {jest} from '@jest/globals';

import { Client} from "../Client"
import { Shutdown } from "../NativeBinding"
import { ClientEventType, SessionEventType } from "vrkit-models"
import { SessionPlayer } from "../SessionPlayer"
import Fixtures from "./DataFixtures"
import { getLogger, getLoggingManager } from "@3fv/logger-proxy"
import { Deferred } from "@3fv/deferred"

const log = getLogger(__filename)
// const logManager = getLoggingManager()
// const fileAppender = new FileAppender({
//   enableRolling: true,
//   maxFiles: 5,
//   maxSize: 2048,
//   filename
// })
// manager
//     .setAppenders(fileAppender)
//
//     .setRootLevel("trace")

jest.setTimeout(10000)

afterAll(async () => {
  log.info("Shutting down")
  await Shutdown();
})

test("SessionPlayer.open", async () => {
  const ibtFile = Fixtures.resolveFile(Fixtures.Files.ibt.IndyCar.RoadAmerica)
  log.info("Opening IBT File: ", ibtFile)
  let player:SessionPlayer = null;
  
  expect(() => {
    player = new SessionPlayer(ibtFile)
    return player
  }).not.toThrow()
  
  const data = player.sessionData
  expect(data.fileInfo.file).toEqual(ibtFile)
  expect(data.timing).toBeDefined()
  
  const sessionTimeHeader = player.getDataVariableHeader("SessionTime")
  expect(sessionTimeHeader).toBeDefined()
  expect(sessionTimeHeader?.name).toEqual("SessionTime")
  
  const sessionTimeVar = player.getDataVariable(sessionTimeHeader.name)
  
  
  const sampleIndexes = Array<[bigint, number]>()
  player.on(SessionEventType.DATA_FRAME, ev => {
    const evData = ev.payload,
        {sampleIndex, sampleCount} = evData.sessionData.timing
    
    const sessionTime = sessionTimeVar.getDouble()
    expect(sampleIndexes.some(([otherSampleIndex]) => otherSampleIndex === sampleIndex)).toBeFalsy()
    // if (sampleIndexes.length && sampleIndexes.length< 10)
    //   expect(sampleIndexes[sampleIndexes.length - 1][1]).toBeLessThan(sessionTime)
    
    sampleIndexes.push([sampleIndex,sessionTime])
    
    log.info("Session time", sessionTime, "Sample received", sampleIndex,"of", sampleCount)
    if (sampleIndexes.length >= 10) {
      log.info("Stopping player after ", sampleIndexes.length, "samples")
      player.off(SessionEventType.DATA_FRAME)
      
      player.stop()
      
    }
  })
  
  expect(player.start()).toBeTruthy()
  
  await Deferred.delay(2000)
  // expect(player.stop()).toBeTruthy()
  
  player.close()
})

test.skip("VRKit Native Event", async () => {
  
  
  const client = new Client()
  let data:any = null
  const testPromise = new Promise<any>((resolve, reject) => {
    let triggered = false
    
    let timer = setTimeout(() => {
      if (triggered)
        return
      
      triggered = true
      reject(Error("Expired"))
    }, 2000)
    
    client.on(ClientEventType.TEST, eventData => {
      if (triggered) {
        console.error("Already expired/called", eventData)
        return;
      }
      
      triggered = true
      clearTimeout(timer)
      console.info("Event data", eventData)
      data = eventData
      
      resolve(data)
    })
    
    
    
    
  })
  
  
  
  try {
    client.testNativeEventEmit()
  } catch (err) {
    console.error("Error while running testNativeEventEmit native side", err)
  }
  await testPromise
  
  console.info("testEvent received: \"{}\"", data)
  expect(data?.type).toEqual(ClientEventType.TEST)
  
  client.destroy()
  
  
})

