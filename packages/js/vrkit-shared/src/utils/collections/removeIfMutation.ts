

export function removeIfMutation<T>(list: Array<T>, predicate: (item: T) => boolean) {
  const removeIndexes = []
  for (let i = 0; i < list.length;i++) {
    if (predicate(list[i])) {
      removeIndexes.push(i)
    }
  }
  
  const allRemovedItems = Array<T>()
  for (let i = 0; i < removeIndexes.length;i++) {
    const index = removeIndexes[i] - i
    const removedItems = list.splice(index, 1)
    allRemovedItems.push(...removedItems)
  }

  return allRemovedItems
}
