export enum SessionDataVariableType {
  // 1 byte
  Char = 0,
  Bool = 1,

  // 4 bytes
  Int32 = 2,
  Bitmask = 3,
  Float = 4,

  // 8 bytes
  Double = 5
}

export const SessionDataVariableTypeSize: { [K in SessionDataVariableType]: number } = {
  [SessionDataVariableType.Char]: 1,
  [SessionDataVariableType.Bool]: 1,
  [SessionDataVariableType.Int32]: 4,
  [SessionDataVariableType.Bitmask]: 4,
  [SessionDataVariableType.Float]: 4,
  [SessionDataVariableType.Double]: 8
}


export interface SessionDataVariableHeader {
  /**
   * @brief Data Type
   */
  readonly type: SessionDataVariableType;
  
  /**
   * @brief Offset in buffer from start of row
   */
  readonly offset: SessionDataVariableType;
  /**
   * @brief Number of entries
   */
  readonly count: number;
  
  readonly countAsTime: boolean;
  readonly pad:number[]
  
  readonly name: string
  readonly description: string
  readonly unit: string
  
}

export interface SessionDataVariable {
  readonly name: string
  readonly type: SessionDataVariableType
  readonly count: number
  readonly valid: boolean
  readonly description: string
  readonly unit: string
  
  getBool(entry?: number): boolean
  getInt(entry?: number): number
  getFloat(entry?: number): number
  getDouble(entry?: number): number
}

export interface SessionDataVariableCtor {
  new(name: string): SessionDataVariable
}