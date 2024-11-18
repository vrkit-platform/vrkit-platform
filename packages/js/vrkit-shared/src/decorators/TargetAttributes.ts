import { ClassConstructor } from "@3fv/guard"
import type { AttributeType } from "./Attribute"
import { asOption } from "@3fv/prelude-ts"

export const TARGET_ATTRIBUTES_KEY = "TARGET_ATTRIBUTES_KEY"

export class TargetAttributes<T extends {} = any> {
  private readonly attributes = new Map<keyof T, AttributeType>()

  private constructor(readonly target: ClassConstructor<T>) {}

  setAttribute(key: keyof T, type: AttributeType) {
    this.attributes.set(key, type)
  }

  getAttribute(key: keyof T) {
    return this.attributes.get(key)
  }

  get keys() {
    return [...this.attributes.keys()]
  }

  get allAttributes() {
    return new Map(this.attributes)
  }

  private static readonly targets = new Map<
    ClassConstructor<any>,
    TargetAttributes
  >()

  static getTarget<T extends {}>(target: ClassConstructor<T>) {
    const { targets } = TargetAttributes
    let attributes = targets.get(target)
    if (!attributes) {
      attributes = new TargetAttributes(target)
      targets.set(target, attributes)
    }

    return attributes
  }

  static allTargets() {
    return new Map(TargetAttributes.targets)
  }
}

if (process.env.NODE_ENV !== "production") {
  Object.assign(
    typeof window !== "undefined"
      ? window
      : typeof global !== "undefined"
      ? global
      : {},
    { TargetAttributes }
  )
}


