
export const BundledModuleNames = [
  "@3fv/guard",
  "@3fv/deferred",
  "@3fv/logger-proxy",
  "@3fv/prelude-ts",
  "@3fv/ditsy",
  "@mui/material",
  "@mui/material/Box",
  "@mui/material/styles",
  "@mui/styled-engine",
  "@mui/styled-engine-sc",
  "@emotion/cache",
  "@emotion/react",
  "@emotion/styled",
  "@mui/system",
  "@mui/lab",
  "@mui/x-data-grid",
  "@mui/x-tree-view",
  "lodash",
  "usehooks-ts",
  "@vrkit-platform/plugin-sdk",
  "@vrkit-platform/models",
  "@vrkit-platform/shared",
  "@vrkit-platform/shared-ui",
  "electron",
  "react",
  "react/jsx-runtime",
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