import "source-map-support/register"
import type {} from "@vrkit-platform/shared"

const g = global as any
if (typeof isDev === "undefined") {
  g.isDev = true
}

export {}
