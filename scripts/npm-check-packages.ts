import Path from "path"
import Tracer from "tracer"
import Fsx from "fs-extra"
import pkgJson from "../package.json"
import Yargs from "yargs"
// import {Command, CommandOptions} from "commander"
import npmCheck, { type INpmCheckPackage } from "npm-check"

const log = Tracer.colorConsole()

//const scriptsDir = Path.resolve(import.meta.dirname)
const buildDir = Path.resolve(__dirname)
const rootDir = Path.resolve(buildDir, ".."),
  outDir = Path.join(rootDir, "tmp"),
  outFiles = {
    unused: Path.join(outDir, "unused-pkgs.csv"),
    missing: Path.join(outDir, "missing-pkgs.csv")
  },
  jsDir = Path.join(rootDir, "packages", "js"),
  jsAppDir = Path.join(jsDir, "vrkit-app"),
  jsAppSrcDir = Path.join(jsAppDir, "src")
    // ,
    // prog = new Command()



async function run() {
  const result = await npmCheck({
    cwd: jsAppDir
  })

  // log.info("Check result", result)

  const excludePatterns = [/^@?electron/, /^@?swc/, /^reflect-metadata$/, /^vrkit/]

  const checkExcluded = (pkg: INpmCheckPackage) => {
    return !excludePatterns.some(exp => exp.test(pkg.moduleName))
  }

  const unusedPkgs = result
    .get("packages")
    .filter(it => it.unused)
    .filter(checkExcluded)

  const missingInPackageJsonPkgs = result
    .get("packages")
    .filter(it => it.notInPackageJson)
    .filter(checkExcluded)

  const toCSV = (pkgs: INpmCheckPackage[]) => {
    const rows = Array<any>()
    for (const pkg of pkgs) {
      rows.push([pkg.moduleName, pkg.devDependency, pkg.isInstalled, pkg.usedInScripts?.join(",")].join(","))
    }

    return rows.join("\n")
  }

  await Promise.all([
    Fsx.writeFile(outFiles.unused, toCSV(unusedPkgs)),
    Fsx.writeFile(outFiles.missing, toCSV(missingInPackageJsonPkgs))
  ])
}

Yargs(process.argv.slice(2))
    .version(pkgJson.version)
    .help()
    .command({command: '$0',
      describe: "Check package modules utilization",
      handler: async args => {
        await run()
      }
    })
    .parse()

