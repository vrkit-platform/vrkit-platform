const { assert } = require("@3fv/guard")
const Sh = require("shelljs")
const { reactTargetToPath, reactTargetToPagePath } = require("../util/plop-react-constants")



function registerReactHelpers(plop) {
	plop.setHelper("reactTargetToPath", (target) => {
		const path = reactTargetToPath[target]
		assert(Sh.test("-d", path), `Unable to find valid target (${target}) mapped to ${path}`)
		return path
	})

	plop.setHelper("reactTargetToPagePath", (target) => {
		const path = reactTargetToPagePath[target]
		assert(Sh.test("-d", path), `Unable to find valid target (${target}) mapped to ${path}`)
		return path
	})


}
module.exports = registerReactHelpers
