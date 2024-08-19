export function getAndDelete<K, V>(map:Map<K, V>,
  key:K
):V {
  if (!map.has(key)) {
    return null
  }
  
  const value = map.get(key)
  map.delete(key)
  return value
}