import Path from "path"
import Tracer from "tracer"
import { fs as Fs } from "zx"
import JSON5 from "json5"
import YAML from "yaml"

const log = Tracer.colorConsole()

const buildDir = Path.resolve(__dirname)
const rootDir = Path.resolve(buildDir, "..")

const files = Fs.globSync("docs/**/*.json5", {
  cwd: rootDir
}).map(file => Path.join(rootDir, file))

async function run() {

}

run()
