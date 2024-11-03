import { isString } from "@3fv/guard"
import builtinModules from "builtin-modules"

const electronExternalsExclude = [
  // APP
  "vrkit-native-interop",
  
  // ELECTRON
  "electron",
  "electron/main",
  "@electron/remote",
  "@electron/remote/main",
  
  
  
  // CUSTOM
  "iohook-raub",
  "node-fetch",
  "i18next-locize-backend",
  "node-plugin-require-context",
  "bluebird",
  "image-size",
  "debug",
  "yargs",
  "pug",
  "handlebars",
  "crypto-js",
  "moment",
  "lodash",
  "class-validator",
  /reflect-metadata/,
  /@swc\/helpers/,
  "shelljs",
  
  // NODE & OTHER BUILT-INS
  ...builtinModules.reduce((mods, mod) => [...mods, mod, `node:${mod}`], []),
]

const electronExternals = ({ context, request }, callback) => {
  const excludes = electronExternalsExclude.filter(Boolean)

  const mustInclude =
    (/(!?.*node_modules)(vrkit-[a-zA-Z0-9-_]+)/.test(request) ||
      /logger-proxy/.test(request) ||
      // /(!?.*node_modules)3fv/.test(request) ||
      ///@?sendone(!?.*node_modules)/.test(request) ||
      // /@?3fv(!?.*node_modules)/.test(request) ||
      /get-port/.test(request) ||
      /(webpack\/hot|react|@pmmmwh|material-ui)/.test(request)) &&
			!/typeorm/.test(request) &&
      !/pg/.test(request) &&
      !/nest-repl/.test(request)
  
  if (
    !mustInclude &&
    excludes.some(test =>
      test instanceof RegExp
        ? test.test(request)
        : isString(test)
        ? request === test
        : false
    )
  ) {
    callback(null, "commonjs " + request)
  } else {
    callback()
  }
}
export {
  electronExternals
}
