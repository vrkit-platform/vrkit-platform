export type Tuple<Length extends number, Types> = Types & {
  length: Length
}
