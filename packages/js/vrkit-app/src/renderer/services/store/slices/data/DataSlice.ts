import { getLogger } from "@3fv/logger-proxy"
import {
  EntityAdapter,
  createSlice,
  PayloadAction,
  EntityStateAdapter
} from "@reduxjs/toolkit"
import type { DataState } from "./DataState"
// import {
//   accountAdapter,
//   collaboratorAdapter,
//   issueAdapter,
//   milestoneAdapter,
//   projectAdapter,
//   tagAdapter,
//   workspaceAdapter
// } from "./DataState"

import { capitalize, upperFirst } from "lodash"
import { entriesOf } from "vrkit-app-common/utils"

const log = getLogger(__filename)
const { info, debug, warn, error } = log

// export const dataTypeActions = {
//   workspace: workspaceAdapter
// }

/**
 * New initial state instance
 *
 * @returns {DataState}
 */
const newDataState = (): DataState => ({

})

/**
 * workspaceAdapter
 */
const createEntityAdapterActions = <
  P extends keyof DataState,
  T,
  A extends EntityStateAdapter<T, P> = EntityStateAdapter<T, P>
>(
  dataKey: P,
  adapter: EntityAdapter<T, P>
) =>
  entriesOf(adapter)
    // FILTER ONLY DATA MOD ACTIONS
    .filter(([name]) =>
      [
        /^add(One|Many)$/,
        /^set(One|Many|All)$/,
        /^update(One|Many)$/,
        /^remove(One|Many|All)$/,
        /^upsert(One|Many)$/
      ].some(expr => expr.test(name))
    )
    // WRAP & CONVERT
    .reduce(
      (map,[name, fn]:any) => ({
        ...map,
        [`${dataKey}${upperFirst(name)}`]: (
          state: DataState,
          ...args: any[]
        ) => {
          const result = fn(state[dataKey], ...args)
          if (result) {
            state[dataKey] = result
          }
          return state
        }
      }),
      {} as any
    ) as {
    [NN in keyof A as NN extends string
      ? `${P}${Capitalize<NN>}`
      : never]: A[NN] extends (state: any, ...args: infer Args) => infer RP
      ? (state: DataState, ...args:Args) => DataState | void
      : never
  }

const slice = createSlice({
  name: "data",
  initialState: newDataState(),
  reducers: {
    patch: (state: DataState, action: PayloadAction<Partial<DataState>>) => {
      Object.assign(state, action.payload ?? {})
    },
    // setSelectedWorkspaceId(
    //   state,
    //   { payload: workspaceId }: PayloadAction<string>
    // ) {
    //   state.selectedWorkspaceId = workspaceId
    //   return state
    // },

    // ...createEntityAdapterActions("workspaces", workspaceAdapter),
    // ...createEntityAdapterActions("projects", projectAdapter),
    // ...createEntityAdapterActions("accounts", accountAdapter),
    // ...createEntityAdapterActions("issues", issueAdapter),
    // ...createEntityAdapterActions("collaborators", collaboratorAdapter),
    // ...createEntityAdapterActions("milestones", milestoneAdapter),
    // ...createEntityAdapterActions("tags", tagAdapter)
  },
  extraReducers: builder =>
    builder
      // .addCase(
      //   startAccountGithubFlow.fulfilled,
      //   (state, { payload: pending }) => {
      //     state.pendingAccount = pending
      //     return state
      //   }
      // )
      // .addCase(startAccountGithubFlow.rejected, (state, { payload: error }) => {
      //   state.pendingAccount = null
      //   return state
      // })
      // .addCase(
      //   checkAccountGithubFlow.fulfilled,
      //   (state, { payload }) => {
      //     if (!payload) {
      //       info(`No payload, still pending`)
      //       return
      //     }
      //
      //     const { pending, account } = payload
      //     state.pendingAccount = pending
      //     if (account)
      //       accountAdapter.upsertOne(state.accounts, account)
      //   }
      // )
      // .addCase(checkAccountGithubFlow.rejected, (state, { payload: error }) => {
      //   log.error(`check github flow failed with error`, error)
      //   state.pendingAccount = null
      // })
      // .addCase(saveAccount.fulfilled, (state, { payload: serviceAccount }) => {
      //   accountAdapter.upsertOne(state.accounts, serviceAccount)
      // })
})

/**
 * Reducer and generated actions
 */
export const { reducer: dataReducer, actions: dataActions } = slice

export default slice
