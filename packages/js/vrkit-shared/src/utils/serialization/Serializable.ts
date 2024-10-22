import { AnyJson } from "../Types"
import { ClassConstructor, isClass, isFunction } from "@3fv/guard"

export interface ISerializable {
  toJSON(): any
}

export interface SerializableConstructor<T extends ISerializable> extends ClassConstructor<T> {
  fromJSON(o: AnyJson<T>): T
}

export function isSerializable<T extends ISerializable>(o:any):o is T {
  return isFunction(o?.toJSON)
}


export function isSerializableConstructor(ctor:any):ctor is SerializableConstructor<any> {
  return isFunction(ctor?.fromJSON) && isClass(ctor)
}
