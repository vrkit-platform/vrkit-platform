

export enum Environment {
  local = "local",
  staging = "staging",
  production = "production"
}

export type EnvironmentKind = Environment | `${Environment}`
