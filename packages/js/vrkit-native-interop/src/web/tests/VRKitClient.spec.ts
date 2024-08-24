// import "jest"
import {jest} from '@jest/globals';

import { VRKitClient, VRKitClientEvent, VRKitShutdown } from "../VRKitClient"

jest.setTimeout(5000)

afterAll(async () => {
  console.log("Shutting down")
  await VRKitShutdown();
  
  
})

test("VRKit Native Event", async () => {
  
  
  const client = new VRKitClient()
  let data:any = null
  const testPromise = new Promise<any>((resolve, reject) => {
    let triggered = false
    
    let timer = setTimeout(() => {
      if (triggered)
        return
      
      triggered = true
      reject(Error("Expired"))
    }, 2000)
    
    client.on(VRKitClientEvent.TEST, eventData => {
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
  expect(data?.type).toEqual(VRKitClientEvent.TEST)
  
  client.destroy()
  
  
})

