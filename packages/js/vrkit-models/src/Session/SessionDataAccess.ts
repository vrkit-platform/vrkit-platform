
import { getLogger } from "@3fv/logger-proxy"
import {
  SessionDataVariableType, type SessionDataVariableValueMap
} from "./SessionTypes"

const log = getLogger(__filename)

/**
 * JS mapping types
 */
export enum SessionDataAccessValueType {
  Number = "Number",
  Bool = "Bool"
}

/**
 * Kind of `SessionDataAccessValueType`
 */
export type SessionDataAccessValueKind = `${SessionDataAccessValueType}`

/**
 * Native types mapped to JS types
 */
export interface SessionDataAccessValueMappedType {
  Bool: boolean
  Number: number
}
export type SessionDataVarNames<VarNames extends string> = Record<VarNames, string>
export function toSessionDataVarNames<VarNames extends string>(...dataVarNames: VarNames[]): SessionDataVarNames<VarNames> {
  return dataVarNames.reduce((map, varName) => ({
    ...map,
    [varName]: varName
  }), {} as any)
}
export type SessionDataVarNamesKey<VarNames> = VarNames extends SessionDataVarNames<infer K> ? K : never
/**
 * Access data vars
 */
export class SessionDataAccess<VarNames extends string> {
  
  static readonly ErrorValues: {[K in SessionDataAccessValueKind]: SessionDataAccessValueMappedType[K]} = {
    Number: -2,
    Bool: null
  }
  
  static readonly DefaultValues: {[K in SessionDataAccessValueKind]: SessionDataAccessValueMappedType[K]} = {
    Number: -1,
    Bool: false
  }
  
  
  static readonly Types: Record<SessionDataAccessValueKind, SessionDataVariableType[]> ={
    Number: [SessionDataVariableType.Int32, SessionDataVariableType.Float, SessionDataVariableType.Double],
    Bool: [SessionDataVariableType.Bool]
  }
  
  readonly dataVarNames: SessionDataVarNames<VarNames>
  
  /**
   * Create a new data access object
   *
   * @param dataVarValues
   * @param varNames
   */
  static create<VarNames extends string>(dataVarValues: SessionDataVariableValueMap, ...varNames: VarNames[]) {
    return new SessionDataAccess<VarNames>(dataVarValues, ...varNames)
  }
  
  /**
   * Create a new access object
   *
   * @param dataVarValues
   * @param varNames
   */
  constructor(readonly dataVarValues: SessionDataVariableValueMap, ...varNames: VarNames[]) {
    this.dataVarNames = toSessionDataVarNames<VarNames>(...varNames)
  }
  
  /**
   * Generic get
   *
   * @param type
   * @param name
   * @param idx
   * @param defaultValue
   */
  get<Type extends SessionDataAccessValueKind, R extends SessionDataAccessValueMappedType[Type] = SessionDataAccessValueMappedType[Type]>(
      type: Type,
      name: string,
      idx: number = 0,
      defaultValue: R = SessionDataAccess.DefaultValues[type] as R
  ): R {
    const dataVar = this.dataVarValues[name]
    if (!dataVar) {
      log.error(`DataVar ${name} is not enabled in the manifest or is invalid`)
      return SessionDataAccess.ErrorValues[type] as R
    }
    
    if (!SessionDataAccess.Types[type].includes(dataVar?.type)) {
      log.error(`DataVar ${name} type is not mapped as a ${type} (type=${dataVar?.type})`)
      return SessionDataAccess.ErrorValues[type] as R
    }
    
    return (dataVar.values[idx] as R) ?? defaultValue
  }
  
  /**
   * Get a number
   *
   * @param name
   * @param idx
   * @param defaultValue
   */
  getNumber(name: string, idx: number = 0, defaultValue: number = SessionDataAccess.DefaultValues.Number): number {
    return this.get("Number", name, idx, defaultValue)
  }
  
  /**
   * Get a bool
   *
   * @param name
   * @param idx
   * @param defaultValue
   */
  getBool(name: string, idx: number = 0, defaultValue: boolean = SessionDataAccess.DefaultValues.Bool): boolean {
    return this.get("Bool", name, idx, defaultValue)
  }
}