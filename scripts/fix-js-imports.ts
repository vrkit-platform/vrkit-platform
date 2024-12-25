import {asOption} from "@3fv/prelude-ts"
import {isString} from "@3fv/guard"
import Path from "path"
import Tracer from "tracer"
import Fs from "fs-extra"
import { range } from "lodash"

const log = Tracer.colorConsole()

//const scriptsDir = Path.resolve(import.meta.dirname)
const buildDir = Path.resolve(__dirname)
const rootDir = Path.resolve(buildDir, ".."),
    jsDir = Path.join(rootDir,"packages","js"),
    jsSharedDir = Path.join(jsDir,"@vrkit-platform/shared"),
    jsSharedSrcDir = Path.join(jsSharedDir,"src")

const allPatterns = () => [
    /"vrkit-app-common\/([a-zA-Z0-9-_\/.]+)"/g
]

log.info(`Scanning ${jsSharedSrcDir}`)
const files = Fs.globSync("**/*.{tsx,ts}", {
  cwd: jsSharedSrcDir
}).map(file => Path.join(jsSharedSrcDir, file))


async function run() {
  
  for (const srcFile of files) {
    log.info(`Processing ${srcFile}`)
    const data = Fs.readFileSync(srcFile, "utf-8"),
        fileDir = Fs.lstatSync(srcFile).isDirectory() ? srcFile : Path.dirname(srcFile),
        relPath = asOption(fileDir.substring(jsSharedSrcDir.length))
            .map(it => it.split("/").filter(it => isString(it) && it.length))
            .map(parts => range(0,parts.length).map(() => "..").join("/"))
            .get()
    
    let changeCount = 0
    let newData = data
    allPatterns().forEach(exp => {
      
      
      newData = newData.replace(exp, (match, subPath) => {
        const newSubPath = `"${relPath}/${subPath}"`
        // log.info(`Replacing import in (${srcFile}): `, match, subPath,newSubPath)
        changeCount++
        return newSubPath
      })
      
      
    })
    
    if (changeCount) {
      log.info(`Persisting changes ${srcFile}`)
      Fs.writeFileSync(srcFile, newData)
    }
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