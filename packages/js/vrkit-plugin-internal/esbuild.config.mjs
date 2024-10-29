//import process from 'process';
import builtins from "builtin-modules"
import esbuild from "esbuild"
import * as Path from "node:path"

const prod = process.env.NODE_ENV === "production",
  watch = !prod && process.env.BUILD_WATCH === "1",
  outdir = Path.resolve(import.meta.dirname, "dist"),
  outfile = Path.join(outdir, "bundled-plugin.js")

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
        "vrkit-plugin-sdk",
        "vrkit-models",
        "vrkit-shared",
        "vrkit-shared-ui",
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
      await ctx.watch()
    } else {
      await esbuild.build(opts)
    }
  } catch (err) {
    console.error(`Build failed`, err)
    throw err
  } finally {
    ctx?.dispose()
  }
}

run()
