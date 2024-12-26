/** @type {import('ts-jest').JestConfigWithTsJest} **/
const { createDefaultPreset } = require('ts-jest')

module.exports = {
  ...createDefaultPreset({
    useESM: true
  }),
  testEnvironment: "node",
  testMatch: [
    "**/src/**/*.spec.ts"
    //"<rootDir>/src/**/?(*)(test|spec).(ts)"
    // "**/lib/**/*.spec.js"
  ],
  
};