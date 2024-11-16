import { assign, defaults } from "lodash"


/**
 * Base persistent properties for
 * auditing changes
 */
export class Auditable {
  updatedBy?: string

  updatedAt?: Date

  createdBy?: string

  createdAt?: Date

  /**
   * Log an object touch, should be
   * integrated with events, etc later (specifically for principal)
   *
   * @returns {this & {createdAt:Date | number, updatedAt:number}}
   */
  touch(): this {
    const now = new Date()
    return assign(this, {
      updatedAt: now,
      createdAt: this.createdAt ?? now
    }) as this
  }

  // toJSON() {
  //   return serialize(Auditable, this)
  // }

  constructor(from: Partial<Auditable> = {}) {
    defaults(assign(this, from), {
      createdAt: new Date(),
      updatedAt: new Date()
    })
  }
}

/**
 * Check if the object provided
 * is an instance of `Auditable`
 *
 * @returns {boolean}
 * @param o
 */
export function isAuditable(o: any): o is Auditable {
  return (
    o instanceof Auditable ||
    o?.prototype?.isPrototypeOf?.(Auditable) ||
    Object.getPrototypeOf(o) === Auditable
  )
}

/**
 * Simple interface describing
 * the shape for auditing
 */
export interface IAuditable extends Partial<Auditable> {}


function createUpdatedAtComparator<T extends Auditable>(checkFn: (
  updatedTime: number,
  sourceTime: number
) => boolean) {
  return (updatedModel:Partial<T>, sourceModel:Partial<T>) => {
    if (!updatedModel || !sourceModel) {
      return updatedModel === sourceModel
    }
    const updatedModelTime = updatedModel?.updatedAt ?? new Date(),
      sourceModelTime = sourceModel?.updatedAt ?? new Date()
    
    
    return checkFn(updatedModelTime.getTime(), sourceModelTime.getTime())
    
  }
}



/**
 * Check if a model has been updated or is up-to-date
 *
 * @param updatedModel potentially updated model
 * @param sourceModel base/source model
 */
export const isModelSameOrUpdated = createUpdatedAtComparator((updated, source) => updated >= source)


export const isModelUpdated = createUpdatedAtComparator((updated, source) => updated > source)