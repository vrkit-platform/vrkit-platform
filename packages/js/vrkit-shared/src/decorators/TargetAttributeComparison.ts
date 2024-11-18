import { ClassConstructor, isArray } from "@3fv/guard"
import { TargetAttributes } from "./TargetAttributes"
import type { AttributeType } from "./Attribute"
import { isEqual } from "lodash"
import { MessageTypeClassConstructor, Pair } from "../utils"
import { getLogger } from "@3fv/logger-proxy"

const log = getLogger(__filename)
const { debug, trace, info, error, warn } = log

export function areAttributeValuesEqual(type: AttributeType, v1: any, v2: any) {
  if (v1 === v2) {
    return true
  } else if (type.isPrimitive && !type.isArray) {
    return false
  }

  if (type.isArray) {
    return (
      isArray(v1) &&
      isArray(v2) &&
      v1.length === v2.length &&
      v1
        .map((vv1, i) => [vv1, v2[i]])
        .every(([vv1, vv2]) => {
          if (vv1 === vv2) {
            return true
          } else if (type.isPrimitive) {
            return false
          }

          const ctor = vv1.constructor ?? vv2.constructor
          if (ctor) {
            return attributesEqual(vv1, vv2, ctor) || isEqual(vv1, vv2)
          } else {
            return isEqual(vv1, vv2)
          }
        })
    )
  }
}

export function attributesEqual<T extends {}>(
  o1: Partial<T>,
  o2: Partial<T>,
  ctor?: ClassConstructor<T> | MessageTypeClassConstructor<T>
) {
  ctor = (ctor ?? o1.constructor ?? o2.constructor) as ClassConstructor<T>
  if (!ctor) {
    warn(`Unable to get constructor`)
    return false
  }

  const target = TargetAttributes.getTarget(ctor)
  if (!target) {
    warn(`Unable to get target attributes for ${ctor?.name}`)
    return false
  }

  const attributes = target.allAttributes
  if (!attributes.size) {
    warn(`No attributes registered for type`)
    return false
  }

  const pairs = [...attributes.entries()] as Pair<string, AttributeType>[]

  return pairs.every(([key, type]) =>
    areAttributeValuesEqual(type, o1[key], o2[key])
  )
}
