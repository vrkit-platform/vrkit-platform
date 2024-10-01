import type { IArrayDidChange, IMapDidChange, IObjectDidChange } from "mobx"
// noinspection TypeScriptDuplicateUnionOrIntersectionType
export type IObserveChange<T = any> = IObjectDidChange<T> | IArrayDidChange<T> | IMapDidChange<T>


export {}