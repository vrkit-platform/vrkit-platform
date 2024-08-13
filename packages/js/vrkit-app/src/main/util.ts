import { URL } from "url"
import Path from "path"
import { pathToFileURL } from "node:url"

export function resolveMainFile(file:string): string {
  return Path.resolve(__dirname, file)
}

export function resolveMainFileURL(file:string): string {
  return pathToFileURL(Path.join(__dirname, file)).href
}

export function resolveHtmlPath(htmlFileName:string): string {
  if (process.env.NODE_ENV === "development") {
    const port = process.env.PORT || 1618
    const url = new URL(`http://localhost:${port}`)
    url.pathname = htmlFileName
    return url.href
  }
  
  return `file://${Path.resolve(__dirname, "..","renderer", htmlFileName)}`
}
