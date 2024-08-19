
export function hasLength(len: number) {
  return <T = any>(arr:Array<T>):boolean  => {
    const n = arr?.length ?? 0
    return n === len
  }
}
