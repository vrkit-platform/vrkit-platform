#!/usr/bin/env node -r ts-node/register

import Path from "path"
import Tracer from "tracer"
import WinReg, { RegistryItem } from "winreg"
import { isString } from "@3fv/guard"
import Yargs from "yargs"
import pkgJson from "../package.json"

const log = Tracer.colorConsole()

const openXRKeyPath = "\\Software\\Khronos\\OpenXR\\1\\ApiLayers\\Implicit"

const buildDir = Path.resolve(__dirname)
const rootDir = Path.resolve(buildDir, "..")

const layersKey = new WinReg({
  hive: WinReg.HKLM,
  key: openXRKeyPath
})

function setValue(key: WinReg.Registry, name: string, value: string) {
  return new Promise<void>((resolve, reject) => {
    key.set(name, WinReg.REG_DWORD, value, err => {
      if (err) {
        reject(err)
      } else {
        resolve()
      }
    })
  })
}

function listValues(key: WinReg.Registry | string) {
  if (isString(key)) {
    key = new WinReg({
      hive: WinReg.HKLM,
      key
    })
  }
  return new Promise<RegistryItem[]>((resolve, reject) => {
    key.values((err, items) => {
      if (err) reject(err)
      resolve(items)
    })
  })
}

Yargs(process.argv.slice(2))
  .version(pkgJson.version)
  .help()
  .command(
    "list",
    "Check package modules utilization",
    yargs => {},
    async args => {
      const values = await listValues(layersKey)

      if (!values.length) {
        process.stdout.write(`No OpenXR layers found in registry`)
      } else {
        process.stdout.write(`Enabled\tPath\n`)
        for (const value of values) {
          process.stdout.write(`${value.value === "0x0"}\t${value.name}\n`)
        }
      }
    }
  )
  .command(
    "toggle <index>",
    "Toggle enabled flag for layer",
    yargs => {
      return yargs.positional("index", {
        describe: "Index of the layer to toggle",
        type: "number"
      })
    },
    async args => {
      const idx = args.index
      const values = await listValues(layersKey)
      if (!values.length) {
        process.stdout.write(`No OpenXR layers found in registry\n`)
        return
      }
      if (idx < 0 || idx >= values.length) {
        throw Error(`idx must be >= 0 && < ${values.length} (# of registered layers)`)
      }

      const value = values[idx],
        newValueEnabled = value.value === "0x0" ? "0x1" : "0x0"

      process.stdout.write(`Setting (${value.name}) to enabled (${newValueEnabled === "0x0"})\n`)
      await setValue(layersKey, value.name, newValueEnabled)
    }
  )
  .parse()
