import Path from "path"
import Tracer from "tracer"
import { fs as Fs } from "zx"

const log = Tracer.colorConsole()

//const scriptsDir = Path.resolve(import.meta.dirname)
const buildDir = Path.resolve(__dirname)
const rootDir = Path.resolve(buildDir, "..")

const files = Fs.globSync("package.json", {
  cwd: rootDir
}).map(file => Path.join(rootDir, file))

function sortObjectProperties(value: any) {
  return (
    Object.keys(value)
      .sort()
      .reduce((obj, k) => {
        obj[k] = value[k]
        return obj
      }, {})
  )
}

async function run() {
  for (const pkgFile of files) {
    log.info(`Formatting ${pkgFile}`)
    const pkg = Fs.readJSONSync(pkgFile)
    if (!pkg) continue

    Array("dependencies", "devDependencies")
      .filter(k => typeof pkg[k] === "object")
      .forEach(k => {
        log.info(`Sorting ${k}`)
        pkg[k] = sortObjectProperties(pkg[k])
      })

    // log.debug(JSON.stringify(pkg, null, 2))
    log.info(`Writing ${pkgFile}`)
    Fs.writeFileSync(pkgFile, JSON.stringify(pkg, null, 2), "utf-8")
  }
}

run()

// const formatter = async (obj, filePath) => {
//   const content = JSON.stringify(obj, null, 2);
//
//   // Try to use prettier if it can be imported,
//   // otherwise add a new line at the end
//   let prettier;
//   try {
//     prettier = require('prettier');
//   } catch (error) {
//     return `${content}\n`;
//   }
//
//   let config = await prettier.resolveConfig(
//     filePath ? path.dirname(filePath) : process.cwd()
//   );
//
//   if (!config) {
//     config = {};
//   }
//
//   return prettier.format(content, {
//     ...config,
//     parser: 'json',
//     printWidth: 0,
//   });
// };
//
// export default formatter;