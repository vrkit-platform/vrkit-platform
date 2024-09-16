const PlopContext = require("../PlopContext")
const assert = require("assert")
const { reactTargetToPath } = require("../util/plop-react-constants")
const { rootDir } = PlopContext


const { pkg } = PlopContext,
				{ version } = pkg


module.exports = plop => {



	return {
		description: "Add a new package to the mono-repo",
		prompts: [
			{
				type: "list",
				name: "targetModule",
				choices:
								Object.keys(reactTargetToPath)
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
					name: "{{name}}",
					target: "{{targetModule}}"
				},

				// abortOnFail: true,
				// base: `${rootDir}/resources/plop/templates/react-component`,
				templateFile: `${rootDir}/tools/plop/templates/react-component/index.ts.hbs`,
				path: `${rootDir}/{{reactTargetToPath targetModule}}/{{dashCase name}}/index.ts`
			},

			{
				type: "add",
				data: {
					version,
					dirName: "{{dashCase name}}",
					name: "{{name}}"
				},

				// abortOnFail: true,
				// base: `${rootDir}/resources/plop/templates/react-component`,
				templateFile: `${rootDir}/tools/plop/templates/react-component/Component.tsx.hbs`,
				path: `${rootDir}/{{reactTargetToPath targetModule}}/{{dashCase name}}/{{name}}.tsx`
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

			// UPDATE PROJECT
			// {
			//   type: "update-project",
			//   abortOnFail: true
			// }
		]
	}
}
