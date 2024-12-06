import * as React from "react"

const w = window as any
if (typeof process === "undefined") {
  w["process"] = {}
}

w["React"] = React

const p = process as any
p["platform"] = "win32"
export {}
