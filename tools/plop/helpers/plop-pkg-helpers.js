const { assert } = require("@3fv/guard")
const Sh = require("shelljs")
const PlopContext = require("../PlopContext")
const { negate, isEmpty } = require("lodash")
const { pkgRoots } = PlopContext

const isNotEmpty = negate(isEmpty)
function registerPkgHelpers(plop) {
	plop.setHelper("targetPkgRoot", (pkgFullname) => {
		const pkgConfig = pkgRoots[pkgFullname]
		assert(isNotEmpty(pkgConfig?.root) && Sh.test("-d", pkgConfig?.root),
      `Unable to find valid target (${pkgFullname}) mapped to ${pkgConfig?.root}`)
		return pkgConfig.root
	})

}

module.exports = registerPkgHelpers
