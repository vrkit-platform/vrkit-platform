import { pathToFileURL, URL } from "url"
import Path from "path"

import { assert } from "@3fv/guard"
import { promises as FsAsync } from "fs"
import { ClazzOrModelSchema, deserialize } from "serializr"

export function fileExists(file: string) {
  return FsAsync.stat(file).then(
    () => true,
    err => {
      if (err?.code === "ENOENT") {
        return false
      } else {
        throw err
      }
    }
  )
}

export async function readJSONFile(file: string) {
  assert(await fileExists(file), `File does not exist: ${file}`)
  const bytes = await FsAsync.readFile(file, "utf-8")

  return JSON.parse(bytes)
}

/**
 * read object from file
 * @param file
 * @param schema
 * @returns
 */
export async function readObjectFile<T>(
  file: string,
  schema: ClazzOrModelSchema<T>
) {
  const json = await readJSONFile(file)
  return deserialize(schema, json) as T
}


export function resolveMainFile(file:string): string {
  return Path.resolve(__dirname, file)
}

export function resolveMainFileURL(file:string): string {
  return pathToFileURL(Path.join(__dirname, file)).href
}

export function resolveHtmlPath(htmlFileName:string): string {
  // if (process.env.NODE_ENV === "development") {
  //   const port = process.env.PORT || 1618
  //   const url = new URL(`http://localhost:${port}`)
  //   url.pathname = htmlFileName
  //   return url.href
  // }
  
  return Path.resolve(__dirname, "..","renderer", htmlFileName)//`file://${Path.resolve(__dirname, "..","renderer", htmlFileName)}`
}
