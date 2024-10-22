export function Identity<T>(t: T): T {
  return t
}

export type Identity<T> = (t: T) => T

export const FilterTrue = <T>(value: T) => true

export const Noop: any = () => {}

export function noopAs<T = void>(
  defaultValue?: T | undefined
): () => T {
  return () => defaultValue
}
