export function Run<T = any>(fn: () => T): T {
  return fn()
}

export const run = Run

export function hasElements(elements: {
  length: number
}): boolean {
  return elements && elements.length > 0
}
