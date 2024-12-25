//import process from 'process';
import builtins from "builtin-modules"
import esbuild from "esbuild"
import * as Path from "node:path"

const prod = process.env.NODE_ENV === "production",
  watch = !prod && process.env.BUILD_WATCH === "1",
  outdir = Path.resolve(import.meta.dirname, "dist"),
  outfile = Path.join(outdir, "bundled-plugin.js")

console.log(`process.env.BUILD_WATCH=${process.env.BUILD_WATCH}`)
console.log(`watch=${watch}`)
//outfile = "bundled-plugin.js"

async function run() {
  let ctx = null
  try {
    const opts = {
      entryPoints: ["src/index.ts"],
      bundle: true,
      external: [
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
        "@vrkit-platform/plugin-sdk",
        "@vrkit-platform/models",
        "@vrkit-platform/shared",
        "@vrkit-platform/shared-ui",
        "electron",
        "react",
        "react-dom",
        ...builtins
      ],
      
      format: "cjs", // watch,
      target: "es2020",
      logLevel: "info",
      sourcemap: prod ? false : "inline",
      treeShaking: true,
      
      outfile
    }
    
    if (watch) {
      ctx = await esbuild.context(opts)
      console.log("Starting watch...")
      ctx.watch()
        .catch(err => {
          console.error("Watch error", err)
        })
    } else {
      await esbuild.build(opts)
    }
  } catch (err) {
    console.error(`Build failed`, err)
    throw err
  }
  // finally {
  //   ctx?.dispose()
  // }
}

run()
