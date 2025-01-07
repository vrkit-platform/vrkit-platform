import { padStart } from "lodash"
import { splitMilliseconds } from "./TimeTools"

export interface DurationViewProps {
  millis: number

  showHours?: boolean

  showMillis?: boolean
}

export function DurationView({ millis, showMillis = false, showHours = false }: DurationViewProps) {
  const { hrs, mins, secs, ms } = splitMilliseconds(millis, showHours, showMillis)
  return (
    <time>
      {showHours && `${padStart(hrs.toString(), 2, "0")}:`}
      {padStart(mins.toString(), 2, "0")}:{padStart(secs.toString(), 2, "0")}
      {showMillis && `.${padStart(ms.toString(), 3, "0")}`}
    </time>
  )
}
