export class MixedMap<K, V> {
  private weakMap: WeakMap<any, V> | undefined
  private map: Map<any, V> | undefined

  has(key: K): boolean {
    return this.getMap(key).has(key)
  }

  get(key: K): V | undefined {
    return this.getMap(key).get(key)
  }

  set(key: K, value: V): this {
    this.getMap(key).set(key, value)
    return this
  }

  delete(key: K): boolean {
    return this.getMap(key).delete(key)
  }

  private getMap(key: K): Map<any, V> | WeakMap<any, V> {
    if (typeof key === "object" && key !== null) {
      if (this.weakMap) {
        return this.weakMap
      } else {
        return (this.weakMap = new WeakMap<any, V>())
      }
    } else {
      if (this.map) {
        return this.map
      } else {
        return (this.map = new Map<any, V>())
      }
    }
  }
}


