import { SessionDataVariableValueMap, SessionTiming } from "vrkit-models"
import { SessionPlayerId } from "../../../common/models/sessions"
import { SessionPlayer } from "vrkit-native-interop"

export class SessionPlayerContainer {
  readonly disposers = Array<() => void>()
  
  private timing_:SessionTiming = null
  
  private dataVarValues_:SessionDataVariableValueMap = {}
  
  get timing() {
    return this.timing_
  }
  
  get dataVarValues() {
    return this.dataVarValues_
  }
  
  constructor(readonly id:SessionPlayerId, readonly player:SessionPlayer) {
  }
  
  dispose() {
    this.disposers.forEach(disposer => disposer())
  }
  
  setDataFrame(
      timing:SessionTiming,
      dataVars:SessionDataVariableValueMap = {}
  ):void {
    this.timing_ = timing
    this.dataVarValues_ = dataVars
  }
}