import { get as _get, bind as _bind } from "lodash"
import { Getter } from "./ObjectTypes"
import { asOption } from "@3fv/prelude-ts"
import { isFunction } from "@3fv/guard"
import { throwError } from "../Exceptions"

export type AnyFn = (...args: any[]) => any

export type LiftedPropFn<
  Key extends string,
  ValueBase extends object = object
> = <Value extends ValueBase>(
  o: Value
) => Key extends keyof Value
  ? Value extends Record<Key, infer T>
    ? T
    : Value[Key]
  : never

export function liftProp<Key extends string, ValueBase extends object = object>(
  prop: Key,
  defaultValue?: Key extends keyof ValueBase ? ValueBase[Key] : unknown
): LiftedPropFn<Key, ValueBase> {
  return o => _get(o, prop, defaultValue as any)
}

export function liftPropDeep<PropType, Value extends object = any>(
  prop: string | string[],
  defaultValue?: PropType
): Getter<Value, PropType> {
  return o => _get(o, prop, defaultValue as any)
}

export type LiftedPropFuncInvoker<Key extends string> = <
  Value,
  PropFnType extends Key extends keyof Value
    ? Value[Key] extends (...args: infer Params) => infer Result
      ? (...args: Params) => Result
      : never
    : never,
  Params extends Parameters<PropFnType>,
  Result extends ReturnType<PropFnType>
>(
  o: Value
) => Result
// (
//   Key extends keyof Value ?
//     (Value[Key] extends (...args: any[]) => infer PropFnReturnType ? PropFnReturnType : never)
//     : never
//   )

export type FunctionOf<O extends {}, Key extends keyof O> = O[Key] extends (
  ...args: any[]
) => any
  ? () => ReturnType<O[Key]>
  : never
//(Key extends keyof O ? (O[Key] extends () => infer R ? () => R : never)
//: never)

export function liftFnProp<
  O extends {},
  Key extends keyof O,
  R extends FunctionOf<O, Key> = FunctionOf<O, Key>
>(prop?: Key): FunctionOf<O, Key> {
  return ((o: O) =>
    asOption(o[prop] as O[Key])
      .filter(isFunction)
      .match({
        Some: (fn: O[Key]) =>
          isFunction(fn)
            ? fn.apply(o, [])
            : throwError(`${prop as any} is not a function`),
        None: () => throwError(`${prop as any} is not a function`)
      })) as R
}

/**
 * Bind arguments to a function with optional
 * `thiz` instance
 *
 * @param thiz
 * @param fn to bind to
 * @param args to apply to function
 */
export function bind<
  Fn extends (...args: any[]) => any,
  Args extends Parameters<Fn>
>(fn: Fn, thiz: any, ...args: Args): () => ReturnType<Fn> {
  return _bind(fn, thiz, ...args)
}

export const liftIndex =
  <A extends unknown[], I extends number, T extends A[I]>(
    index: I
  ): ((items: A) => T) =>
  (items: A) =>
    items[index] as T
