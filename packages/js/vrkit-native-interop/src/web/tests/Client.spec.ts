// import "jest"
import { jest } from "@jest/globals"

import { Client } from "../Client"
import { Shutdown } from "../NativeBinding"
import { ClientEventType, SessionEventType } from "vrkit-models"
import { GetLiveVRKitSessionPlayer, SessionPlayer } from "../SessionPlayer"
import Fixtures from "./DataFixtures"
import { getLogger } from "@3fv/logger-proxy"
import { Deferred } from "@3fv/deferred"

const log = getLogger(__filename)

jest.setTimeout(10000)

beforeAll(() => {
  process
      .on('unhandledRejection', (reason, p) => {
        console.error(reason, 'Unhandled Rejection at Promise', p);
      })
      .on('uncaughtException', err => {
        console.error(err, 'Uncaught Exception thrown');
        // process.exit(1);
      });
  
})
afterAll(async () => {
  log.info("Shutting down")
  await Shutdown();
})

test("SessionPlayer.open", async () => {
  const ibtFile = Fixtures.resolveFile(Fixtures.Files.ibt.IndyCar.RoadAmerica)
  //log.info("Opening IBT File: ", ibtFile)
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
  const sampleIndexes = Array<[number, number]>()
  player.on(SessionEventType.DATA_FRAME, (player, ev) => {
    const
        evData = ev.payload,
        {sampleIndex, sampleCount} = evData.sessionData.timing
    
    const sessionTime = sessionTimeVar.getDouble()
    // log.info("Session time", sessionTime, "Sample received", sampleIndex,"of", sampleCount)
    
    expect(sampleIndexes.some(([otherSampleIndex]) => otherSampleIndex === sampleIndex)).toBeFalsy()
    if (sampleIndexes.length && sampleIndexes.length< 10)
      expect(sampleIndexes[sampleIndexes.length - 1][1]).toBeLessThan(sessionTime)
    
    sampleIndexes.push([sampleIndex,sessionTime])
    
    
    if (sampleIndexes.length >= 10) {
      //log.info("Stopping player after ", sampleIndexes.length, "samples")
      player.off(SessionEventType.DATA_FRAME)
      
      player.stop()
      
    }
  })
  
  // expect(player.start()).toBeTruthy()
  
  await Deferred.delay(2000)
  
  player.close()
})

test.skip("SessionPlayer.live", async () => {
  let player:SessionPlayer = GetLiveVRKitSessionPlayer()
  
  try {
    expect(player.start()).toBeTruthy()
    await Deferred.delay(1000)
    expect(player.isAvailable).toBeTruthy()
    
    const headers = player.getDataVariableHeaders()
    expect(headers.length).toBeGreaterThan(0)
    
    // const dir = fs.mkdtempSync("vrkit")
    // if (!fs.existsSync(dir))
    //   fs.mkdirSync(dir)
    // const headerJsonFile = path.join(dir, "headers.json")
    // log.info("Headers",headers.length,headerJsonFile)
    // fs.writeFileSync(headerJsonFile, JSON.stringify(headers,null,2), 'utf-8')
    //
    
    const sessionTimeHeader = player.getDataVariableHeader("SessionTime")
    expect(sessionTimeHeader).toBeDefined()
    expect(sessionTimeHeader?.name).toEqual("SessionTime")
    
    const sessionTimeVar = player.getDataVariable(sessionTimeHeader.name)
    const sampleIndexes = Array<[number, number]>()
    player.on(SessionEventType.DATA_FRAME, (player, ev) => {
      try {
        const evData = ev.payload, {
          sampleIndex, sampleCount
        } = evData.sessionData.timing
        
        const sessionTime = sessionTimeVar.getDouble()
        const hasDuplicates = sampleIndexes.some(([otherSampleIndex]) =>
            otherSampleIndex ===  sampleIndex)
        
        // log.info("Live session time", sessionTime, "Sample received", sampleIndex,"of", sampleCount, "hasDups", hasDuplicates)
        expect(hasDuplicates).toBeFalsy()
        if (sampleIndexes.length && sampleIndexes.length < 10) expect(
            sampleIndexes[sampleIndexes.length - 1][1])
            .toBeLessThan(sessionTime)
        
        sampleIndexes.push([sampleIndex, sessionTime])
        
        
        if (sampleIndexes.length >= 10) {
          //log.info("Stopping player after ", sampleIndexes.length, "samples")
          player.off(SessionEventType.DATA_FRAME)
          
          player.stop()
          
        }
      } catch (err) {
        log.error("unable to handle event",err)
      }
    })

    // expect(player.start()).toBeTruthy()
    
    await Deferred.delay(2000)
    player.stop()
    player.close()
  } finally {
    player.destroy()
    player = null
  }
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
        return;
      }
      
      triggered = true
      clearTimeout(timer)
      expect(eventData.type).toEqual(ClientEventType.TEST)
      
      resolve(data = eventData)
    })
  })
  
  
  
  try {
    client.testNativeEventEmit()
  } catch (err) {
    console.error("Error while running testNativeEventEmit native side", err)
  }
  
  await expect(testPromise).resolves.toBeDefined()
  
  expect(data?.type).toEqual(ClientEventType.TEST)
  
  client.destroy()
  
  
})

