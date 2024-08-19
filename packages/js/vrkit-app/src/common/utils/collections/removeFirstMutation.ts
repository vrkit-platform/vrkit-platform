
export function removeFirstMutation<T>(list: Array<T>, predicate: (item: T) => boolean) {
  const index = list.findIndex(predicate)
  let removed:T = null
  if (index > -1) {
    ;[removed] = list.splice(index, 1)
  }
  return removed
}
