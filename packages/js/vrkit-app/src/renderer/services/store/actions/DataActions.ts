import { getLogger } from "@3fv/logger-proxy"

const log = getLogger(__filename)

// noinspection JSUnusedLocalSymbols,ES6ShorthandObjectProperty,TypeScriptExplicitMemberType
const { debug, trace, info, error, warn } = log

//
// /**
//  * Save Data action
//  *
//  * @type {AppThunk<Data, Data>}
//  */
// export const saveData = createAppAsyncThunk<Data, Data>("Data/saveData",
//   async (Data, api) => {
//     try {
//       const pendingData = cloneObject(Data),
//         DataManager = withContainer(DataManager),
//         db = getAppDatabase()
//
//       if (isEmpty(pendingData.id)) {
//         pendingData.id = generateUUID()
//         debug(`Creating new Data (${pendingData.toJSON()})`)
//       }
//
//       // DB Transaction
//       const savedData = await db.transaction(
//         "rw",
//         db.Datas,
//         async _trans => {
//           const Data = await DataManager.save(pendingData)
//
//           return Data
//         }
//       )
//
//       // Debugging
//       if (isDev) {
//         debug(`savedData`, savedData)
//       }
//
//       return savedData
//     } catch (err) {
//       error(`Unable to get all Datas`, err)
//       throw api.rejectWithValue(err)
//     }
//   }
// )
export {}
