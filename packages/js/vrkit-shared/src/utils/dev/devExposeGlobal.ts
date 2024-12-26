
export function devExposeGlobal(key: string, value: any) {
  if (isDev) {
    Object.assign(typeof window !== "undefined" ? window : global, {
      [key]: value
    })
  }
}
