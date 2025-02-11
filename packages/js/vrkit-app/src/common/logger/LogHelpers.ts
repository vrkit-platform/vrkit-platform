import { isString } from "@3fv/guard"
import { pick } from "lodash"

export function GetMessageFromArgs<Args extends any[]>(...args: Args): [string, any[]] {
  const SharedMod = require("@vrkit-platform/shared"),
      { isErrorKind } = SharedMod
  
  let msg = ""
  if (isString(args[0])) {
    msg = args[0]
    args.splice(0,1)
  } else if (isErrorKind(args[0])) {
    msg = args[0]?.message ?? "NOT AVAILABLE"
  }
  
  return [msg, args]
}

export function ToCleanArgs<Args extends any[]>(...args: Args): Args {
  const SharedMod = require("@vrkit-platform/shared"),
    { toPlainObjectDeep, isErrorKind } = SharedMod
    
  return args.map(it =>
      isErrorKind(it) ?
          pick(it, ["message", "stack", "type", "name"]) : it
      ).map(it => toPlainObjectDeep(it)) as any
}
