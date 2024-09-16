// noinspection JSUnresolvedVariable

const PlopContext = require("../PlopContext")
const assert = require("assert")
const { rootDir } = PlopContext
const F = require("lodash/fp")
const { nestTargetToPath } = require("../util/plop-infra-constants")

const { pkg, pkgRoots } = PlopContext,
  { version } = pkg

/**
 * @typedef {import("node-plop").NodePlopAPI} Plop
 * @param  plop {Plop.NodePlopAPI}
 */
function generator(plop) {
  return {
    description: "Add a new ditsy service to a library or app",
    prompts: [
      {
        type: "list",
        name: "target",
        choices: Object.keys(pkgRoots),
        message: "target package or app"
      },
      {
        type: "input",
        name: "name",
        message:
          "Service name",
        validate: input => /^[a-zA-Z0-9]+$/.test(input)
      },
      {
        type: "confirm",
        name: "skipSuffix",
        default: "false",
        message:
          "Skip suffix"
      },
      {
        type: "input",
        name: "suffix",
        default: "Service",
        message:
          "Custom Suffix (default 'Service')",
        when: (answers) => {
          const shouldSkip = [true, "true"].includes(answers.skipSuffix)
          console.log("answers", answers.skipSuffix, answers)
          return !shouldSkip
        },
        validate: input => /^([\sa-zA-Z0-9]+)?$/.test(input)
      }
    ],

    actions: [
      // GENERATE NEW FILES
      {
        type: "add",
        templateFile: `${rootDir}/tools/plop/templates/service/ServiceImpl.ts.hbs`,
        path: `{{targetPkgRoot target}}/src/services/{{dashCase name}}/{{name}}{{getSuffix skipSuffix suffix}}.ts`
      },
      {
        type: "add",
        templateFile: `${rootDir}/tools/plop/templates/service/ServiceIndex.ts.hbs`,
        path: `{{targetPkgRoot target}}/src/services/{{dashCase name}}/index.ts`
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

module.exports = generator
