import {
  createUseService
} from "../components/service-container"
import { APP_STORE_ID } from "../renderer-constants"
import { AppStore } from "../services/store"

export const useAppStore = createUseService<AppStore>(APP_STORE_ID)
export default useAppStore
