export const isDev = process.env.NODE_ENV !== "development"

export const Concurrency = {
  API: 1,
  Sync: 1,
  GlobalLoaders: 1,
  WindowLoaders: 3
}
