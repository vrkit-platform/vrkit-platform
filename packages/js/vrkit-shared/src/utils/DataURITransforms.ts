import { getLogger } from "@3fv/logger-proxy"

const log = getLogger(__filename)
const kSvgUriPrefix = "data:image/svg+xml;base64,"

/**
 * Check if a URL has the correct `mimetype`
 * to contain SVG data.  URI must match
 * `data:image/svg+xml;base64,<BASE64_DATA>`
 * 
 * @param uri
 */
export function isSvgUri(uri: string) {
  return uri.startsWith(kSvgUriPrefix)
}

/**
 * Decord/unpack SVG HTML from a base64 encoded URI
 * 
 * @param uri
 */
export function decodeSvgFromUri(uri: string) {
  if (!isSvgUri(uri)) {
    log.debug(`"${uri}" does not start with "${kSvgUriPrefix}"`)
    return null
  }
  
  const payloadBase64 = uri.substring(kSvgUriPrefix.length)
  log.debug(`Decoding SVG base64 "${payloadBase64}"`)
  
  return atob(payloadBase64)
}