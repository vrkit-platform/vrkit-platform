const PlopContext = require("../PlopContext")
const assert = require("assert")
const { rootDir } = PlopContext
const F = require("lodash/fp")
const { reactTargetToPath, reactTargetToPagePath } = require("../util/plop-react-constants")

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
				choices:
								Object.keys(reactTargetToPagePath)
				,
				message: "target package or app"
			},
			{
				type: "input",
				name: "name",
				message: "name",
				validate: (input) => /^[a-zA-Z0-9]+$/.test(input) && !input.toLowerCase().includes("page")
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

				templateFile: `${rootDir}/tools/plop/templates/react-page/Page.tsx.hbs`,
				path: `${rootDir}/{{reactTargetToPagePath targetModule}}/{{dashCase name}}/{{name}}Page.tsx`
			},
			{
				type: "add",
				data: {
					version,
					dirName: "{{dashCase name}}",
					name: "{{name}}"
				},

				templateFile: `${rootDir}/tools/plop/templates/react-page/index.ts.hbs`,
				path: `${rootDir}/{{reactTargetToPagePath targetModule}}/{{dashCase name}}/index.ts`
			},
			// PRINT FILES
			// {
			// 	type: "print-files",
			// 	abortOnFail: true
			// },
			//
			// // DUMP FILES
			// {
			// 	type: "flush-files",
			// 	abortOnFail: true
			// }

			// UPDATE PROJECT
			// {
			//   type: "update-project",
			//   abortOnFail: true
			// }
		]
	}
}

module.exports = generator
