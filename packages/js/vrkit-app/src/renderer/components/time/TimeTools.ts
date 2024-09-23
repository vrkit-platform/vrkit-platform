import moment from "moment"

export const MILLIS_IN_SEC = 1000
export const MILLIS_IN_MIN = MILLIS_IN_SEC * 60
export const MILLIS_IN_HR = MILLIS_IN_MIN * 60
export const MILLIS_IN_DAY = MILLIS_IN_HR * 24

export const MILLIS_UTC_OFFSET = moment().utcOffset() * MILLIS_IN_MIN

export interface TimeParts {
  hrs:number
  mins:number
  secs:number
  ms:number
}

export function splitMilliseconds(millis: number, showHours: boolean = millis >= MILLIS_IN_HR):TimeParts {
  let hrs = 0
  let ms = millis
  if (showHours) {
    hrs = Math.floor(ms / MILLIS_IN_HR)
    ms -= hrs * MILLIS_IN_HR
  }
  
  const mins = Math.floor(ms / MILLIS_IN_MIN)
  ms -= mins * MILLIS_IN_MIN
  
  const secs = Math.floor(ms / MILLIS_IN_SEC)
  ms -= secs * MILLIS_IN_SEC
  
  return {hrs, mins, secs, ms}
}

export function getLocalTimeMillis() {
  return (Date.now() + MILLIS_UTC_OFFSET) % MILLIS_IN_DAY
}

export function getLocalTimeParts():TimeParts {
  return splitMilliseconds(getLocalTimeMillis());
}