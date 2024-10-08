/** @type {import('ts-jest').JestConfigWithTsJest} **/
module.exports = {
  testEnvironment: "node",
  testMatch: [
    // "<rootDir>/src/**/?(*)(test|spec).(ts)"
    "**/src/**/*.spec.ts"
  ],
  transform: {
    ".+\\.tsx?$": ["@swc/jest"]
  },
  
  modulePathIgnorePatterns: [
    ".*\\.layers.*",
    "<rootDir>\\/lib\\/.*"
  
  ],
  
  
};