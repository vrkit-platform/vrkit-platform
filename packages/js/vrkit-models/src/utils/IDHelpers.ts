
export function IsValidId(id: string) {
  return typeof id === "string" && id.length > 0
}