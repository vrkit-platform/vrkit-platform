import { MixedMap } from "./MixedMap"
import { arrayOf } from "./arrayOf"

interface MultikeyInternalMapValue<V> {
  map: MixedMap<any, MultikeyInternalMapValue<V>>
  isSet: boolean
  value: V
}

export class MultiKeyMap<K, V> {
  private readonly map: MixedMap<any, MultikeyInternalMapValue<V>>

  constructor() {
    this.map = new MixedMap<any, MultikeyInternalMapValue<V>>()
  }

  get(keys: K | K[]): V | undefined {
    const mapValue = this.getMapValueObject(arrayOf(keys))
    return mapValue ? mapValue.value : undefined
  }

  has(keys: K | K[]): boolean {
    const mapValue = this.getMapValueObject(arrayOf(keys))
    return mapValue ? "value" in mapValue : false
  }

  hasAndGet(keys: K | K[]): [boolean, V | undefined] {
    const mapValue = this.getMapValueObject(arrayOf(keys))
    return mapValue ? [mapValue.isSet, mapValue.value] : [false, undefined]
  }

  set(keysArg: K | K[], value: V): void {
    const keys = arrayOf(keysArg)

    let { map } = this

    for (let i = 0; i < keys.length; i++) {
      let key = keys[i]
      let mapValue = map.get(key)

      if (!mapValue) {
        mapValue = {
          map: undefined,
          isSet: false,
          value: undefined
        }

        map.set(key, mapValue)
      }

      if (i < keys.length - 1) {
        if (mapValue.map) {
          map = mapValue.map
        } else {
          map = mapValue.map = new MixedMap<any, MultikeyInternalMapValue<V>>()
        }

        continue
      }

      if (!mapValue.isSet) {
        mapValue.isSet = true
      }

      mapValue.value = value
    }
  }

  delete(keysArg: K | K[]): boolean {
    const keys = arrayOf(keysArg)
    let { map } = this


    for (let i = 0; i < keys.length; i++) {
      let key = keys[i]
      let mapValue = map.get(key)

      if (!mapValue) {
        return false
      }

      if (i < keys.length - 1) {
        if (!mapValue.map) {
          return false
        }

        map = mapValue.map
        continue
      }

      if (mapValue.isSet) {
        mapValue.isSet = false
        mapValue.value = undefined
        return true
      } else {
        return false
      }
    }

    // To pass TypeScript checking.
    return false
  }

  private getMapValueObject(
    keysArg: any[]
  ): MultikeyInternalMapValue<V> | undefined {
    const keys = arrayOf(keysArg)
    let { map } = this

    for (let i = 0; i < keys.length; i++) {
      let key = keys[i]
      let mapValue = map.get(key)

      if (!mapValue) {
        return undefined
      }

      if (i < keys.length - 1) {
        if (!mapValue.map) {
          return undefined
        }

        map = mapValue.map
        continue
      }

      return mapValue
    }

    // To pass TypeScript checking.
    return undefined
  }
}
