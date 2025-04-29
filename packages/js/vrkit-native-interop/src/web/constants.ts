import "./global"

export const isDev = process.env.NODE_ENV !== "production"

const g = global as any
if (g.isDev === undefined) {
  g.isDev = isDev
}