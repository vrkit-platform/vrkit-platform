import * as S from "serializr"
import { AnyJson } from "../Types"
import { ClassConstructor, isClass, isFunction } from "@3fv/guard"

export interface Serializable {
  toJSON(): any
}

export interface SerializableConstructor<T extends Serializable> extends ClassConstructor<T> {
  fromJSON(o: AnyJson<T>): T
}

export function isSerializable<T extends Serializable>(o:any):o is T {
  return isFunction(o?.toJSON)
}


export function isSerializableConstructor(ctor:any):ctor is SerializableConstructor<any> {
  return isFunction(ctor?.fromJSON) && isClass(ctor)
}

//
// export abstract class Serializable
//   implements Serializable
// {
//   static deserialize(data: string) {
//     return S.deserialize(this as any, data)
//   }
//
//   serialize(): string {
//     return S.serialize(this)
//   }
// }
//
// export interface SerializableConstructor<
//   Type extends Serializable
// > {
//   deserialize: (src: string) => Type
//
//   new: () => Type
// }

// export default Serializable
