import { getLogger } from "@3fv/logger-proxy"
import * as ID from "shortid"
import moment from "moment"
import type { v4 as UUIDV4 } from "uuid"
import { isString } from "@3fv/guard"
const log = getLogger(__filename!)

export const IdSeparator = "::"

export function toId(...parts: string[]) {
  return parts.join(IdSeparator)
}

export function generateIdTimestamp() {
  return moment().format("YYYYMMDDHHmmssSSS")
}

/**
 * Generates a short id
 *
 * @returns {string}
 */
export function generateId(): string {
  return ID.generate()
}

export const generateShortId = generateId

export function generateUUID(): string {
  const v4: typeof UUIDV4 = require("uuid").v4
  return v4()
}

export function timestampId() {
  return moment().format("YYYYMMDDHHmmssSSS")
}

export const uuidV4Test = new RegExp(
  "[A-F0-9]{8}-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{12}",
  "i"
)

export function isUUIDv4(s: string) {
  return isString(s) && uuidV4Test.test(s)
}
