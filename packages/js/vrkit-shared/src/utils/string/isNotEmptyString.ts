// import { asOption } from "@3fv/prelude-ts"
// import { isNotEmpty } from "../ObjectUtil"
// import { isString } from "@3fv/guard"
//
//
// // export const isNotEmptyString = (s: any): s is string => isNotEmpty(s) && isString(s)
// export function isNotEmptyString(value: string): value is string {
//   return asOption(value)
//       .filter(isString)
//       .filter(isNotEmpty)
//       .map(() => true)
//       .getOrElse(false)
// }

export {}