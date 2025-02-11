const PlopContext = require("../PlopContext")


function registerNamingHelpers(plop) {
	plop.setHelper("getSuffix", (skipSuffix, suffix) => {
    return  ([true, "true"].includes(skipSuffix))  ? "" : suffix
	})
	
	// plop.setHelper("lowerFirst", (str) => {
	// 	return  !str || !str.length ? str : (str[0] + str.slice(1))
	// })

}

module.exports = registerNamingHelpers
