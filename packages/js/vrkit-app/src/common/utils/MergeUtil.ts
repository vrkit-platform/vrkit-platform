import deepmerge from "deepmerge"
import { assign } from "lodash"

export const deepmergeArrayOverwriteMerge = <T = any>(
  destinationArray: T[],
  sourceArray: T[],
  options: deepmerge.Options
) => sourceArray

export const deepmergeOverwriteArrays: typeof deepmerge =
  assign(
    ((src, dest, opts = {}) =>
      deepmerge(src, dest, {
        ...opts,
        arrayMerge: deepmergeArrayOverwriteMerge
      }) as any) as any,
    {
      ...deepmerge
    }
  )
