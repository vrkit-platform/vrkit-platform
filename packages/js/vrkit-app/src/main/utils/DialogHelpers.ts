import { asOption } from "@3fv/prelude-ts"
import { dialog } from "electron"
import { isNotEmptyString } from "@vrkit-platform/shared"

export function reportMainError(type: "uncaughtException" | "unhandledRejection", ...args: any[]) {
  const
      stack = args.map(it => it?.stack).filter(isNotEmptyString)[0] ?? "Not available",
      errorMsg = asOption(args.map(it => isNotEmptyString(it) ? it : it?.message).filter(isNotEmptyString).join("\n"))
          .filter(isNotEmptyString)
          .getOrElse("Not available"),
      rawData = JSON.stringify(args, null, 2)
  
  dialog.showErrorBox("Unexpected error occurred in main process", `${errorMsg}\ntype: ${type}\nstack: \n${stack}\n\nRaw Details: \n${rawData}`)
}