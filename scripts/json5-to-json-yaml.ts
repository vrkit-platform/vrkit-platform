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
  for (const json5File of files) {
    const
        dir = Path.dirname(json5File),
        baseFilename = Path.basename(json5File,".json5"),
        yamlFile = Path.join(dir,baseFilename + ".yaml"),
        jsonFile = Path.join(dir,baseFilename + ".json"),
        data = JSON5.parse(Fs.readFileSync(json5File, 'utf-8'))
    
    log.info(`converting ${json5File} to: `, {yamlFile, jsonFile})
    
    
    Fs.writeFileSync(yamlFile, YAML.stringify(data))
    
    Fs.writeFileSync(jsonFile, JSON.stringify(data,null,2))
    // const pkg = Fs.readJSONSync(pkgFile)
    // if (!pkg) continue
    //
    // Array("dependencies", "devDependencies")
    //   .filter(k => typeof pkg[k] === "object")
    //   .forEach(k => {
    //     log.info(`Sorting ${k}`)
    //     pkg[k] = sortObjectProperties(pkg[k])
    //   })
    //
    // // log.debug(JSON.stringify(pkg, null, 2))
    // log.info(`Writing ${pkgFile}`)
    // Fs.writeFileSync(pkgFile, JSON.stringify(pkg, null, 2), "utf-8")
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