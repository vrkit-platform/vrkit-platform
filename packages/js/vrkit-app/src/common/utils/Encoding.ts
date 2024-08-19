export function encodeBase64(decoded: string) {
  return typeof btoa !== "undefined"
    ? btoa(decoded)
    : Buffer.from(decoded).toString("base64")
}

export function decodeBase64(encoded: string) {
  return typeof atob !== "undefined"
    ? atob(encoded)
    : Buffer.from(encoded, "base64").toString("ascii")
}
