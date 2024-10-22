// export type PromisedComponent

export function importDefault<
  Import extends Promise<{ default: any }>,
  T extends Import extends Promise<{ default: infer R }>
    ? R
    : never
>(importPromise: Import): Promise<T> {
  return importPromise.then(mod =>
    Promise.resolve(mod.default)
  )
}

export function getModuleDefault<T = any>(
  mod: any,
  fallbackKey: string | null = null
): T {
  return (
    mod.default || (fallbackKey ? mod[fallbackKey] : mod)
  )
}
