/** @type {import('ts-jest').JestConfigWithTsJest} **/
const Fs = require("fs")

const config = JSON.parse(Fs.readFileSync(`${__dirname}/../../../.swcrc`, 'utf-8'))

module.exports = {
  testEnvironment: "node",
  testMatch: [
    // "<rootDir>/src/**/?(*)(test|spec).(ts)"
    "**/src/**/*.spec.ts"
  ],
  transform: {
    ".+\\.tsx?$": ["@swc/jest", {...config}] },
  
  modulePathIgnorePatterns: [
    ".*\\.layers.*",
    "<rootDir>\\/lib\\/.*"
  
  ],
  
  
};