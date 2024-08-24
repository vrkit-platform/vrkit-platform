/** @type {import('ts-jest').JestConfigWithTsJest} **/
module.exports = {
  testEnvironment: "node",
  testMatch: [
    // "<rootDir>/src/**/?(*)(test|spec).(ts)"
    "**/lib/**/*.spec.js"
  ],
  
};