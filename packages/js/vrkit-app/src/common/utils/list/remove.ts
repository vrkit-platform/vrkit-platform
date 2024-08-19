export function remove<T>(
  items: Array<T>,
  predicate: (item: T, index: number) => boolean,
  max: number = -1
): T[] {
  const removed: T[] = []

  while (items.length) {
    if (max > 0 && removed.length >= max) {
      break
    }

    let index = -1
    let found = false
    for (const item of items) {
      index++
      if (predicate(item, index)) {
        found = true
        removed.push(...items.splice(index, 1))
        break
      }
    }

    if (!found) {
      break
    }
  }

  return removed
}
