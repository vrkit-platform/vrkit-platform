// noinspection DuplicatedCode

import { Client } from "../Client"
import { Shutdown } from "../NativeBinding"
import { ClientEventType } from "@vrkit-platform/models"

async function run() {
  // noinspection DuplicatedCode
  
  const client = await Client.Create()
  try {
    const testPromise = new Promise<any>((resolve, reject) => {
      let triggered = false
      client.on(ClientEventType.TEST, data => {
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
    await Shutdown()
    process.exit(0)
  }
}

run()
.catch(err => console.error(err))