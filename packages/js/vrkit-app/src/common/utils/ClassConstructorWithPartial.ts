import type { ClassConstructor } from "@3fv/guard"

export interface ClassConstructorWithPartial<T extends {}> extends ClassConstructor<T> {
  new (from?: Partial<T>): T
}