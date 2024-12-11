import { getLogger } from "@3fv/logger-proxy"
import { getValue } from '@3fv/guard'
import {isDev} from "../../constants"
const log = getLogger(__filename)
const { debug, trace, info, error, warn } = log


export function isURL(url: string) {
  ///^[a-z]+:/.test(icon)
  return  getValue(() => Boolean(new URL(url)), false, err => {
    if (isDev) {
      debug(`isURL could not parse`, err)
    }
  })

}


export function urlProtocol(url: string) {
  return  getValue(() => new URL(url).protocol, null, err => {
    error(`urlProtocol`, err)
  })

}


export function urlProtocolEquals(url: string, protocol: string) {
  return  urlProtocol(url) === protocol

}
