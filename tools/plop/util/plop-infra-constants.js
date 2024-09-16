const PlopContext = require("../PlopContext")

const {rootDir} = PlopContext

const nestTargetToPath = {
	"server": "apps/server/src/modules",
	"electron-main": "apps/electron-main/src/modules",
	"electron-renderer": "apps/electron-renderer/src/modules"
}



module.exports = {
	nestTargetToPath
}
