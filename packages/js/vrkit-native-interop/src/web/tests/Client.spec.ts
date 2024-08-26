// import "jest"
import {jest} from '@jest/globals';

import { Client} from "../Client"
import { Shutdown } from "../NativeBinding"
import { ClientEventType } from "vrkit-models"
import { SessionPlayer } from "../SessionPlayer"
import Fixtures from "./DataFixtures"
import { getLogger } from "@3fv/logger-proxy"

const log = getLogger(__filename)

jest.setTimeout(5000)

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

