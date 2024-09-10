import type { SessionDataVariable, SessionDataVariableType } from "vrkit-native-interop"

export type SessionDataVariableTypeToPrimitive<Type extends SessionDataVariableType> =
  Type extends SessionDataVariableType.Bool ? boolean :
          number

export interface SessionDataVariableValue<Type extends SessionDataVariableType> extends Pick<SessionDataVariable, "name" | "count" | "unit" | "valid">{
  type: Type,
  values: SessionDataVariableTypeToPrimitive<Type>[]
}
