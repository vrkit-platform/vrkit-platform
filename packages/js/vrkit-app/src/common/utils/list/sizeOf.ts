import { isDefined } from "@3fv/guard"
import { throwError } from "../Exceptions"

// export type HasLength = {
//   length: number
// }

// export type HasSize = {
//   size: number
// }

// export type HasLengthOrSize = HasLength | HasSize

// export function hasSize(o: any): o is HasSize {
//   return isDefined(
//     Object.getOwnPropertyDescriptor(o, "size")
//   )
// }

// export function hasLength(o: any): o is HasLength {
//   return isDefined(
//     Object.getOwnPropertyDescriptor(o, "length")
//   )
// }

// export function sizeOf(o: HasLengthOrSize) {
//   return hasSize(o)
//     ? o.size
//     : hasLength(o)
//     ? o.length
//     : throwError(
//         `Value does not have a 'size' or 'length' property`
//       )
// }

export {}
