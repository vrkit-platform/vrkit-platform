import { getLogger } from "@3fv/logger-proxy"

const log = getLogger(__filename)
const { debug, trace, info, error, warn } = log


export function fileToDataURL<T extends string | ArrayBuffer = any>(file): Promise<T> {
  const reader = new FileReader();
  
  return new Promise<T>((resolve,reject) => {
    let settled = false
  
    // HANDLE ABORT
    reader.addEventListener("abort", function (e) {
      warn(`(abort): reading file`, reader.error)
      if (settled) {
        warn(`(abort): Already settled`, reader.error)
        return
      }
      settled = true
      resolve(null)
    }, false)
    
    // HANDLE ERROR
    reader.addEventListener("error", function (e) {
      error(`(error): reading file`, reader.error)
      if (settled) {
        warn(`(error): Already settled`, reader.error)
        return
      }
      settled = true
      reject(reader.error)
    }, false)
    
    // HANDLE SUCCESS
    reader.addEventListener("load", function () {
      debug(`(load): completed`)
      if (settled) {
        warn(`(load): Already settled`, reader.error)
        return
      }
      settled = true
      // convert image file to base64 string
      resolve(reader.result as T)
    }, false)
  
    // START
    reader.readAsDataURL(file);
  })
  
}


