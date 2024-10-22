import { isFunction } from "@3fv/guard"

export function getOrSet<K, V>(
  map: Map<K, V>,
  key: K,
  valueProducer: V | (() => V)
): V {
  if (!map.has(key)) {
    const value = isFunction(valueProducer) ? valueProducer() : valueProducer
    map.set(key, value)
    return value
  } else {
    return map.get(key)
  }
}


