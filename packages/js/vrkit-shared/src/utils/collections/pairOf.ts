import type { Tuple } from "./tuple"

export type Pair<F, S> = Tuple<2, [F, S]> //[F, S] &
export function pairOf<F, S>(
  first: F,
  second: S
): Pair<F, S> {
  return [first, second]
}
