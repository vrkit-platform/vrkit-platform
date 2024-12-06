import { fileURLToPath } from "url"
import * as Path from "path"

export function toModulePaths(url: string | URL) {
  const __filename = fileURLToPath(url)
  return {
    __filename,
    __dirname: Path.dirname(__filename)
  }
}

if (typeof __filename === "undefined" || typeof require === "undefined") {
  //
  // debugger
  // try {
  // 	const require = createRequire(import.meta.url)
  //
  // 	Object.assign(global, {
  // 		require,
  // 		toModulePaths
  // 	})
  // } catch (err) {
  // 	console.error(`Unable to get require`,err)
  // }
}
