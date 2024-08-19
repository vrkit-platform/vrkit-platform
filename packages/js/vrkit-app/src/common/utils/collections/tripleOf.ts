import type { Tuple } from "./tuple"

export type Triple<F, S, T> = Tuple<3, [F, S, T]>

export function tripleOf<F, S, T>(
  first: F,
  second: S,
  third: T
): Triple<F, S, T> {
  return [first, second, third]
}
