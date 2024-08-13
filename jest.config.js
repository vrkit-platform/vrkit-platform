const Path = require("path")
const baseConfig = require("@3fv/project-config/jest/jest.config")
const { omit } = require("lodash")
const rootDir = baseConfig.rootDir
const scriptsDir = Path.join(rootDir, "tools","testing","src")
const { pathsToModuleNameMapper } = require('ts-jest')

const compilerOptions = {
  ...require('./tsconfig.base.json').compilerOptions,
  ...require('./tsconfig.base.cjs.json').compilerOptions
}

module.exports = {
  ...baseConfig,
  moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, { prefix: '<rootDir>/' } ),
  projects: baseConfig.projects
    .filter(({ rootDir }) => !rootDir.endsWith("assets"))
    .map(project => ({
      ...omit(project,"testMatch"),
      name: Path.basename(project.rootDir),
      displayName: Path.basename(project.rootDir),
      testMatch: [
        // "**/src/**/?(*.)+(spec|test).ts?(x)",
        //"src/**/?(*.)+(test|spec).ts"
        // "<rootDir>/src/**/?(*.)+(test|spec).ts",
        "<rootDir>/src/**/?(*)(test|spec).(ts|js)"
      ],
      transform: {
        ".+\\.tsx?$": ["@swc/jest"]
      },


      modulePathIgnorePatterns: [
        ".*\\.layers.*",
        "<rootDir>\\/lib\\/.*"

      ],
      setupFilesAfterEnv: [
          "test-env-common.js",
          "test-env-aws.js"
      ].map(file => Path.join(scriptsDir,file))
    }))
}
