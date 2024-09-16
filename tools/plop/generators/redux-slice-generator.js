const PlopContext = require("../PlopContext")
const assert = require("assert")
const { rootDir } = PlopContext
const F = require("lodash/fp")
const { reduxTargetToStorePath } = require("../util/plop-redux-constants")


const { pkg } = PlopContext,
				{ version } = pkg


/**
 * @typedef {import("node-plop")} Plop
 * @param  plop {Plop.NodePlopAPI}
 */
function generator(plop) {



	return {
		description: "Add a new react-page to the mono-repo",
		prompts: [
			{
				type: "list",
				name: "targetModule",
				choices: Object.keys(reduxTargetToStorePath)
				,
				message: "target package or app"
			},
			{
				type: "input",
				name: "name",
				message: "name",
				validate: (input) => /^[a-zA-Z0-9]+$/.test(input)
			},
			{
				type: "confirm",
				name: "overwrite",
				default: false,

				message: "Should overwrite if needed"
			}
		],

		actions: [

			// GENERATE NEW FILES
			{
				type: "add",
				data: {
					version,
					dirName: "{{dashCase name}}",
					name: "{{name}}"
				},

				templateFile: `${rootDir}/tools/plop/templates/redux-slice/Slice.ts.hbs`,
				path: `${rootDir}/{{reduxTargetToStorePath targetModule}}/slices/{{dashCase name}}/{{name}}Slice.ts`
			},
			{
				type: "add",
				data: {
					version,
					dirName: "{{dashCase name}}",
					name: "{{name}}"
				},
				
				templateFile: `${rootDir}/tools/plop/templates/redux-slice/State.ts.hbs`,
				path: `${rootDir}/{{reduxTargetToStorePath targetModule}}/slices/{{dashCase name}}/{{name}}State.ts`
			},
			{
				type: "add",
				data: {
					version,
					dirName: "{{dashCase name}}",
					name: "{{name}}"
				},
				
				templateFile: `${rootDir}/tools/plop/templates/redux-slice/Actions.ts.hbs`,
				path: `${rootDir}/{{reduxTargetToStorePath targetModule}}/slices/{{dashCase name}}/{{name}}Actions.ts`
			},
			{
				type: "add",
				data: {
					version,
					dirName: "{{dashCase name}}",
					name: "{{name}}"
				},
				
				templateFile: `${rootDir}/tools/plop/templates/redux-slice/index.ts.hbs`,
				path: `${rootDir}/{{reduxTargetToStorePath targetModule}}/slices/{{dashCase name}}/index.ts`
			},
			
			// PRINT FILES
			{
				type: "print-files",
				abortOnFail: true
			},

			// DUMP FILES
			{
				type: "flush-files",
				abortOnFail: true
			}

		]
	}
}

module.exports = generator
