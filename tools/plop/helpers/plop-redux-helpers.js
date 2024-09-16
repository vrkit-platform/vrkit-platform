const { assert } = require("@3fv/guard")
const Sh = require("shelljs")
const { reduxTargetToStorePath } = require("../util/plop-redux-constants")



function registerReduxHelpers(plop) {
	plop.setHelper("reduxTargetToStorePath", (target) => {
		const path = reduxTargetToStorePath[target]
		assert(Sh.test("-d", path), `Unable to find valid target (${target}) mapped to ${path}`)
		return path
	})


}
module.exports = registerReduxHelpers
