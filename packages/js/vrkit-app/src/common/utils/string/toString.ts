export type ToString = { toString(): string }


export function toString(o:any) {
  return o?.toString?.() ?? null
}
