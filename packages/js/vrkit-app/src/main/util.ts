import { URL } from "url"
import Path from "path"

export function resolveHtmlPath(htmlFileName:string): string {
  if (process.env.NODE_ENV === "development") {
    const port = process.env.PORT || 1212
    const url = new URL(`http://localhost:${port}`)
    url.pathname = htmlFileName
    return url.href
  }
  
  return `file://${Path.resolve(__dirname, "../renderer/", htmlFileName)}`
}
