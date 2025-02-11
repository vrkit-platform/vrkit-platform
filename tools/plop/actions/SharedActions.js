
const Fs = require("fs")
const { exec, test, rm } = require("shelljs")
const { ok } = require("assert")
const { asOption } = require("@3fv/prelude-ts")
const Path = require("path")
const assert = require("assert")
const _ = require("lodash")
const PlopContext = require("../PlopContext")
const { plopFileWriter, plopReadJsonFile } = require("../util/plop-shared-utils")
const { rootDir } = PlopContext

module.exports = function register(plop) {
  const {
      outputs} = PlopContext,
    writeFile = plopFileWriter(outputs)

  plop.setActionType("print-files", (answers, config, plopfileApi) => {
    // outputs.forEach(({ filename, content }) => {
    //   console.log(`File: ${filename}\n\n${content}`)
    //   //Fs.writeFileSync(filename, content)
    // })

    return "success"
  })

  plop.setActionType("flush-files", (answers, config, plopfileApi) => {
    // outputs.forEach(({ filename, content }) => {
    //   console.log(`Writing: ${filename}`)
    //   Fs.writeFileSync(filename, content)
    // })

    return "success"
  })

  plop.setActionType("update-project", (answers, config, plopfileApi) => {
    const result = exec(`yarn update:all`, {
      cwd: rootDir,
      silent: true
    })

    ok(result.code === 0, `Failed to update project configs: ${result.stderr}`)
    return "success"
  })

  plop.setActionType("update-project-tsconfig", (answers, config, plop) => {
    const { name,pkgType } = answers,
      overwrite = asOption(answers.overwrite)
        .map(it => (
          it === "true" ? true : it === "false" ? false : it
        ))
        .getOrElse(false),
      packageDir = Path.join(rootDir,pkgType, name),
      //tsRootConfigFile = Path.join(rootDir, "tsconfig.json"),
      //tsRootConfig = plopReadJsonFile(tsRootConfigFile),
      tsBaseConfigFile = Path.join(rootDir, "tsconfig.base.json"),
      tsBaseConfig = plopReadJsonFile(tsBaseConfigFile),
      tsProjectConfigFile = Path.join(rootDir, "tsconfig.json"),
      tsProjectConfig = plopReadJsonFile(tsProjectConfigFile),
      { references: rootRefs } = tsProjectConfig

    assert.ok(
      overwrite || !rootRefs.some(it => _.last(it.path.split("/")) === name),
      `Package with name ${name} already exists`
    )

    assert.ok(
      !!overwrite || !Fs.existsSync(packageDir),
      `Package dir already exists: ${packageDir}`
    )

    if (overwrite === true && test("-e", packageDir)) {
      rm("-Rf", packageDir)
    }

    const refPath = `./packages/js/${name}/tsconfig.json`
    if (!rootRefs.some(ref => ref.path === refPath)) {
      rootRefs.push({
        path: refPath
      })

      writeFile(tsProjectConfigFile, JSON.stringify(tsProjectConfig, null, 2))
    }

    tsBaseConfig.compilerOptions.paths = {
      ...tsBaseConfig.compilerOptions.paths,

      [`@vrkit-platform/${name}`]: [`./packages/js/${name}/src`],
      [`@vrkit-platform/${name}/*`]: [`./packages/js/${name}/src/*`]
    }

    writeFile(tsBaseConfigFile, JSON.stringify(tsBaseConfig, null, 2))

    return "success"
  })
}
