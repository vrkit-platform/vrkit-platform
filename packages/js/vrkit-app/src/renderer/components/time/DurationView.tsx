import { padStart } from "lodash"
import { MILLIS_IN_HR, MILLIS_IN_MIN, MILLIS_IN_SEC } from "./TimeConstants"


export function splitMilliseconds(millis: number, showHours: boolean = millis >= MILLIS_IN_HR) {
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

export function DurationView({millis, showHours}: {millis: number; showHours: boolean}) {
  const {hrs,mins,secs,ms} = splitMilliseconds(millis, showHours)
  return <time>
    {showHours && `${padStart(hrs.toString(),2,'0')}:`}
    {padStart(mins.toString(),2,'0')}:{padStart(secs.toString(),2,'0')}.{padStart(ms.toString(),3,'0')}
  </time>
}