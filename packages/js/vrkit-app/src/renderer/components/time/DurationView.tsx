import { padStart } from "lodash"
import { splitMilliseconds, MILLIS_IN_HR, MILLIS_IN_MIN, MILLIS_IN_SEC } from "./TimeTools"



export function DurationView({millis, showHours}: {millis: number; showHours: boolean}) {
  const {hrs,mins,secs,ms} = splitMilliseconds(millis, showHours)
  return <time>
    {showHours && `${padStart(hrs.toString(),2,'0')}:`}
    {padStart(mins.toString(),2,'0')}:{padStart(secs.toString(),2,'0')}.{padStart(ms.toString(),3,'0')}
  </time>
}