import * as Sh from "shelljs"

const envExports = [
  ["NODE_ENV", "production"],
  ["ELECTRON_PACKAGED", "1"]
]
for (const [name, value] of envExports) {
  process.env[name] = value
  Sh.env[name] = value
}

export {}
