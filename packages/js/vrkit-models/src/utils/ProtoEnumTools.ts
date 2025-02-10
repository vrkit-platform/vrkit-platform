function toSnakeCase(str: string) {
  return str
      .replace(/[-\s]+/g, "_")
      .replace(/([A-Z\d]+)([A-Z][a-z])/g, "$1_$2")
      .replace(/([a-z\d])([A-Z])/g, "$1_$2")
}


type ValuesOf<T extends {}> =
    T extends Map<any, infer V> ? V : T extends { [key in keyof any]: infer V } ? V : never

export function GetEnumLabel<E extends {[k: string | number]: string | number}, V extends (keyof E | ValuesOf<E>)>(
    type:E, value:V, prefix: string = "") {
  const prefixBag = [prefix]
  if (prefix.length) {
    if (!/^[A-Z0-9_]+$/.test(prefix))
      prefix = toSnakeCase(prefix)
    
    prefixBag.push(prefix,
        prefix + "_",
        prefix.substring(0, prefix.length - 1),
        prefix.substring(0, prefix.length - 1) + "_"
    )
  }
  
  let label: string = typeof value === "string" ? value : null
  if (typeof value === "number") {
    label = type[value] as string
  }
  
  label = prefixBag.reduce((label, nextPrefix) => label.startsWith(nextPrefix) ? label.substring(nextPrefix.length) : label, label)
  return label
}