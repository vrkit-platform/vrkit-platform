import { asOption } from "@3fv/prelude-ts"
import moment, { Moment } from "moment"
import { isNumber } from "@3fv/guard"

export type DateKind = Date | number | Moment

export const millisToSecs = (millis: number) =>
  Math.floor(millis / 1000)

export function toMillis(
  val: string | number | Date
): number {
  return moment(val).valueOf()
}

export function utcDate(
  timestamp: number | string | Date = undefined
) {
  return utcMoment(timestamp).toDate()
}

export function utcTimestamp(
  timestamp: number | string | Date = undefined
) {
  return utcMoment(timestamp).valueOf()
}

export function utcMoment(
  timestamp: number | string | Date = undefined
) {
  return asOption(timestamp)
    .map(it => moment.utc(it))
    .getOrCall(() => moment.utc())
}

// noinspection SpellCheckingInspection
export function formatDate(
  date: DateKind,
  template: string = "YYYYMMDDHHmmss"
): string {
  return asOption(
    date instanceof Date
      ? moment(date)
      : isNumber(date)
      ? moment(new Date(date))
      : date
  )
    .map(timestamp => timestamp.format(template))
    .get()
}
