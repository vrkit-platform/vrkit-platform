export type Getter<Value extends object, PropType> = (
  o: Value
) => PropType
