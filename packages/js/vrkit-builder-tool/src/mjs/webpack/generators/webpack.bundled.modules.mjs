
export const BundledModuleNames = [
  "@3fv/guard",
  "@3fv/deferred",
  "@3fv/logger-proxy",
  "@3fv/prelude-ts",
  "@3fv/ditsy",
  "@mui/material/styles",
  "@mui/styled-engine",
  "@mui/system",
  "@mui/material",
  "@mui/lab",
  "@mui/x-data-grid",
  "@mui/x-tree-view",
  "lodash",
  "usehooks-ts",
  "vrkit-plugin-sdk",
  "vrkit-models",
  "vrkit-shared",
  "vrkit-shared-ui",
  "electron",
  "react",
  "react-dom"
]

function generateBundleIdMapCode(deps) {
  return `(function generateBundleIdMap() {
    const map = {};
    ${deps.map(dep => `map["${dep}"] = require.resolve("${dep}");`).join("\n")}
    return map;
  })()`
}

function generateBundleModuleMapCode(deps) {
  return `(function generateBundleModuleMap() {
    const map = {};
    ${deps.map(dep => `map["${dep}"] = require("${dep}");`).join("\n")}
    return map;
  })()`
}

export const BundledModuleIds = generateBundleIdMapCode(BundledModuleNames);
export const BundledModuleMap = generateBundleModuleMapCode(BundledModuleNames);