import { getLogger } from "@3fv/logger-proxy"
import { urlProtocolEquals } from "../../utils"
import { Image, ImageType } from "@vrkit-platform/models"

import { getValue } from "@3fv/guard"

const log = getLogger(__filename)
const { debug, trace, info, error, warn } = log

const invalidURLLogger = (url: string) => (err: any) => warn(`Invalid url: ${url}`, err)

export const UrlProtocolPreset = "preset:"

export class ImageExt {
  static getPresetUrlPathname(url: string) {
    return getValue(() => new URL(url).pathname.replace(/\//g, ""), null, invalidURLLogger(url))
  }

  static isPresetUrl(url: string) {
    return urlProtocolEquals(url, UrlProtocolPreset)
  }

  static presetUrl(pathname: string) {
    return `${UrlProtocolPreset}//${pathname}`
  }

  static presetIcon(pathname: string) {
    return Image.create({
      type: ImageType.preset,
      url: `${UrlProtocolPreset}//${pathname}`
    })
  }
}
