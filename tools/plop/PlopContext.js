const Path = require("path")
const Fs = require("fs-extra")
const rootDir = Path.resolve(__dirname, "..", "..")
const jsDir = Path.join(rootDir, "packages", "js")
const pkgFile = Path.join(rootDir, "package.json")
const pkg = require(pkgFile)
const { ls } = require("shelljs")

const pkgDirs = Fs.readdirSync(jsDir)
  .map(dirName => Path.join(jsDir, dirName))

const pkgRoots = Object.fromEntries(
  //["apps","libs"].map(dir => Path.join(rootDir, dir))
  pkgDirs
  .flatMap(pkgTypeRoot => {
    const pkgTypeRootName = Path.basename(pkgTypeRoot)
    const type = pkgTypeRootName.replace(/s$/,"")
    return ls(pkgTypeRoot)
      .map(it => it.toString())
        .map(name => {
          const fullName = `${pkgTypeRootName}/${name}`,
            pkgRoot = Path.join(pkgTypeRoot, name)

          return [
            fullName,
            {
              name,
              type,
              fullName,
              root: pkgRoot
            }
          ]
        })
    }
  )
)

const PlopContext = {
  rootDir,
  pkgFile,
  pkg,
  pkgRoots,
  version: pkg.version,
  outputs: Array()
}


module.exports = PlopContext

