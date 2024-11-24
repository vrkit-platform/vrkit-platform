// import type {PartialDeep} from "type-fest"

const toString = Object.prototype.toString
const assignSymbols = require("assign-symbols")

const isValidKey = key => {
  return (
    key !== "__proto__" &&
    key !== "constructor" &&
    key !== "prototype"
  )
}

export const assign = <T extends object>(
  target: T,
  ...args: Array<Partial<T>>
): T => {
  let i = 0
  if (isPrimitive(target)) target = args[i++] as any

  if (!target) target = {} as any

  for (; i < args.length; i++) {
    if (isObject(args[i])) {
      for (const key of Object.keys(args[i])) {
        if (isValidKey(key)) {
          if (
            isObject(target[key]) &&
            isObject(args[i][key])
          ) {
            assign(target[key], args[i][key])
          } else {
            target[key] = args[i][key]
          }
        }
      }
      assignSymbols(target, args[i])
    }
  }
  return target
}

function isObject(val) {
  return (
    typeof val === "function" ||
    toString.call(val) === "[object Object]"
  )
}

export function isPrimitive(val) {
  return typeof val === "object"
    ? val === null
    : typeof val !== "function"
}

export const assignDeep = assign
