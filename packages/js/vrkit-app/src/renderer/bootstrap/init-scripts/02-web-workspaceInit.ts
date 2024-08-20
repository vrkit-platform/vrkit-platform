import { Container } from "@3fv/ditsy"
import { getLogger } from "@3fv/logger-proxy"
import { appStore } from "../../services/store"


import { Pair, pairOf, SerializableConstructor } from "vrkit-app-common/utils"
import { EntityStateAdapter } from "@reduxjs/toolkit"

import {
  CaseReducerActions,
  SliceCaseReducers
} from "@reduxjs/toolkit/src/createSlice"
import { isDev } from "../../constants"

const log = getLogger(__filename)
const { info, debug, warn, error } = log

export async function init(container: Container) {
  debug(`init workspace/projects`)

  let unsubscribe: Function = null
  
  if (import.meta.webpackHot) {
    import.meta.webpackHot.dispose(() => {
      if (unsubscribe) {
        unsubscribe()
      }

      // dbChangeService.off("all", changeListener)
    })
  }
}

export default init
