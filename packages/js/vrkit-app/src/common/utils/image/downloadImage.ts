import { isFunction } from "@3fv/guard"

export function downloadImage(url: string, init: RequestInit = {}) {
  return fetch(url, init).then(response => response.arrayBuffer())
}

export function bufferToBase64(buffer: ArrayBuffer) {
  return typeof window !== "undefined" && isFunction(window.btoa)
    ? window.btoa(
        [].slice
          .call(new Uint8Array(buffer))
          .map(bin => String.fromCharCode(bin))
          .join("")
      )
    : Buffer.from(buffer).toString("base64")
}

export function downloadImageToBase64(url: string, init: RequestInit = {}) {
  return downloadImage(url, init).then(bufferToBase64)
}
