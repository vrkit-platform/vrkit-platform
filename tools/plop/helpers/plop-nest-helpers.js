const { assert } = require("@3fv/guard")
const Sh = require("shelljs")
const { nestTargetToPath } = require("../util/plop-infra-constants")
const { jobRunnerTargetsToPath } = require("../util/plop-job-constants")



function registerNestHelpers(plop) {
	plop.setHelper("nestTargetToPath", (target) => {
		const path = nestTargetToPath[target]
		assert(Sh.test("-d", path), `Unable to find valid target (${target}) mapped to ${path}`)
		return path
	})
	
	plop.setHelper("jobRunnerTargetsToPath", (target) => {
		const path = jobRunnerTargetsToPath[target]
		assert(Sh.test("-d", path), `Unable to find valid target (${target}) mapped to ${path}`)
		return path
	})
}

module.exports = registerNestHelpers
