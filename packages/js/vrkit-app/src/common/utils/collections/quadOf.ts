import type { Tuple } from "./tuple"

export type Quad<F, S, T,L> = Tuple<4, [F, S, T,L]>

export function quadOf<F, S, T,L>(
  first?: F,
  second?: S,
  third?: T,
  last?: L
): Quad<F, S, T,L> {
  return [first, second, third, last]
}
