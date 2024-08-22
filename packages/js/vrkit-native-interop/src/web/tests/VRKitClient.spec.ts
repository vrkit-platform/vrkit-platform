import "jest"
import { VRKitClientEvent } from "../VRKitClient"

test("VRKit Native Event", async () => {
  const {VRKitClient} = await import("../VRKitClient")
  
  const client = new VRKitClient()
  
  const testPromise = new Promise((resolve, reject) => {
    let triggered = false
    client.on("LiveSessionChanged",data => {
      if (triggered) {
        console.error("Already expired/called")
        return;
      }
      triggered = true
      
      console.info("testEvent received: \"LiveSessionChanged\"", data)
      expect(data?.type).toEqual(VRKitClientEvent.LiveSessionChanged)
    })
    
    setTimeout(() => {
      if (triggered)
        return
      
      triggered = true
      reject(Error("Expired"))
    }, 2000)
  })
  
  client.testNativeEventEmit()
  
  await testPromise
  
  
})

