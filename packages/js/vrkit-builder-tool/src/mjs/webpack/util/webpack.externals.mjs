import { isString } from "@3fv/guard"

const electronExternalsExclude = [
  "vrkit-native-interop",
  "electron",
  "electron/main",
  "@electron/remote",
  "@electron/remote/main",
  "node-fetch",
  "i18next-locize-backend",
  "node-plugin-require-context",
  "assert",
  "async_hooks",
  "buffer",
  "child_process",
  "cluster",
  "console",
  "constants",
  "crypto",
  "dgram",
  "dns",
  "domain",
  "events",
  "fs",
  "http",
  "http2",
  "https",
  "inspector",
  "module",
  "bluebird",
  "net",
  "os",
  "path",
  "perf_hooks",
  "process",
  "punycode",
  "querystring",
  "readline",
  "repl",
  "stream",
  "string_decoder",
  "timers",
  "tls",
  "trace_events",
  "tty",
  "url",
  "util",
  "v8",
  "vm",
  "zlib",

  // CUSTOM
  "image-size",
  "debug",
  "x-ray",
  /^(@?aws)/,
  /dockerode/,

  "csv",
  "csv-parse",
  "csv-stringify",
  "csv-generate",
  "yargs",
  "class-transformer",
  "cronosjs",
  // "uuid",
  "pug",
  "handlebars",
  "crypto-js",
  "moment",
  "lodash",
  "class-validator",
  "node:net",
  "node:fs",
  "node:os",
  "node:buffer",
  /\@nestjs/,
  /express/,
  /^mz/,
  "pug",
  "request",
  /tunnel-agent/,
  /reflect-metadata/,
  /@nestcloud/,
  /@nestjs\//,
  /puppeteer/,
  /@swc\/helpers/,
  "cron-parser",
  "shelljs",
  "any-promise",
  /@logdna/,

  // TYPEORM
  /pg-native/,
  /aurora-data-api-pg/,
  /typeorm/,
  /react-native/,
  /nodemailer/,
  /mssql/,
	/firebase-admin/
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
