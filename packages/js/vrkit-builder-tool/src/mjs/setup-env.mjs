import { createRequire } from 'module'
import { fileURLToPath } from 'url';
import Path from 'path';

export function toModulePaths(url) {
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
