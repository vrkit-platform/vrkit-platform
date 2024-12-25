require("source-map-support/register")

const registerSharedActions = require("./tools/plop/actions/SharedActions")
const Fs = require("fs")
const { asOption } = require("@3fv/prelude-ts")
const Path = require("path")
const { echo } = require("shelljs")
const { isFunction } = require("@3fv/guard")
const registerReactHelpers = require("./tools/plop/helpers/plop-react-helpers")
// const registerReduxHelpers = require("./tools/plop/helpers/plop-redux-helpers")
// const registerNestHelpers =  require("./tools/plop/helpers/plop-nest-helpers")
// const registerPkgHelpers =  require("./tools/plop/helpers/plop-pkg-helpers")
// const registerNamingHelpers =  require("./tools/plop/helpers/plop-naming-helpers")

module.exports = function plopfile(plop) {
  
  // registerReduxHelpers(plop)
  // registerSharedActions(plop)
  registerReactHelpers(plop)
  // registerNestHelpers(plop)
  // registerPkgHelpers(plop)
  // registerNamingHelpers(plop)

  const addGenerator = (name, configFilename = name) =>
    asOption(configFilename)
      .map(configFilename =>
        Path.resolve(
          __dirname,
          "tools",
          "plop",
          "generators",
          `${configFilename}-generator.js`
        )
      )
      .tap(configFile =>
        echo(
          `Loading generator from config file (${configFile})`
        )
      )
      .filter(Fs.existsSync)
      .map(require)
      // .filter(mod => !!mod.default)
      .match({
        Some: config =>
          plop.setGenerator(
            name,
            isFunction(config) ? config(plop) : config
          ),
        None: () => {
          throw Error(
            `failed to load config (${configFilename}) for ${name}`
          )
        }
      })

  // addGenerator("new-package")
  // addGenerator("new-api-client-package")
	// addGenerator("nest-module")
  // addGenerator("service")
  // addGenerator("job-runner-module")
  // addGenerator("redux-slice")
  addGenerator("react-component")
	addGenerator("react-page")
}
