const PlopContext = require("../PlopContext")
const { rootDir } = PlopContext

const { pkg } = PlopContext,
  { version } = pkg

module.exports = {
  description: "Add a new package to the mono-repo",
  prompts: [
    {
      type: "input",
      name: "name",
      message: "New package name",
      validate: input => /^[a-z0-9\-,]+$/.test(input)
    },
    {
      type: "confirm",
      name: "overwrite",
      default: false,

      message: "Should overwrite if needed"
    }
  ],

  actions: [
    // PROCESS COMMON FILES
    {
      type: "update-project-tsconfig"
    },

    // GENERATE NEW FILES
    {
      type: "addMany",
      data: {
        version,
        name: "{{name}}",
        
      },

      // abortOnFail: true,
      base: `${rootDir}/tools/plop/templates/new-package`,
      templateFiles: `${rootDir}/tools/plop/templates/new-package/**/*.hbs`,
      destination: `${rootDir}/packages/js/{{name}}/`
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
