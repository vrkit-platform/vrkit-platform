// noinspection DuplicatedCode

import { VRKitClientEvent,VRKitShutdown, VRKitClient } from "../VRKitClient"

async function run() {
  // noinspection DuplicatedCode
  
  const client = new VRKitClient()
  try {
    const testPromise = new Promise<any>((resolve, reject) => {
      let triggered = false
      client.on(VRKitClientEvent.TEST, data => {
        if (triggered) {
          console.error("Already expired/called")
          return;
        }
        triggered = true
        
        console.info("testEvent received: \"VRKitClientEvent.TEST\"", data)
        resolve(data)
      })
      
      setTimeout(() => {
        if (triggered) return
        
        triggered = true
        reject(Error("Expired"))
      }, 2000)
    })
    
    try {
      client.testNativeEventEmit()
    } catch (err) {
      console.error("Error while running testNativeEventEmit native side", err)
    }
    await testPromise
  } catch (err) {
    console.error("Failed test", err)
  } finally {
    await VRKitShutdown()
    process.exit(0)
  }
}

run()
.catch(err => console.error(err))