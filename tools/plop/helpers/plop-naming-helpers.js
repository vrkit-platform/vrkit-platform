const PlopContext = require("../PlopContext")


function registerNamingHelpers(plop) {
	plop.setHelper("getSuffix", (skipSuffix, suffix) => {
    return  ([true, "true"].includes(skipSuffix))  ? "" : suffix

	})

}

module.exports = registerNamingHelpers
