import Path from "path"
import { getUserDataDir } from "./Paths"
import Fs from "fs"
import { AnyJson, Pair, pairOf, toJsonAny } from "vrkit-app-common/utils"
import { AppSettings, appSettingsSchema } from "vrkit-app-common/models"
import { asOption } from "@3fv/prelude-ts"
import { ClazzOrModelSchema, deserialize, ModelSchema, serialize } from "serializr"
import { fileExists } from "./FsExtra"
import { mainAppStateSchema } from "../models"


export  namespace  FileStorage {

  export type FileConfig = Pair<ClazzOrModelSchema<any>, string>
  export type FileType = "state" | "accelerators"
  export const files: Record<FileType,FileConfig> ={
    state: pairOf<ClazzOrModelSchema<any>, string>(mainAppStateSchema, Path.join(getUserDataDir(), "app-state.json")),
    accelerators: pairOf<ClazzOrModelSchema<any>, string>(null,Path.join(getUserDataDir(), "app-accelerators.json"))
  }



  // const file = Path.join(getUserDataDir(), "app-settings.json")

  function hydrateData(data: AnyJson<AppSettings>): AppSettings {
    return asOption(data ?? {})
      .map(toJsonAny)
      .map(json => deserialize(appSettingsSchema, json))
      .getOrNull()
  }

  /**
   * Get settings sync
   *
   * @return {AppSettings}
   */
  export function getSync(type: FileType) {
    const file = files[type][1]
    const data = Fs.existsSync(file) ? Fs.readFileSync(file, "utf-8") : null
    return hydrateData(data)
  }

  /**
   * Load app settings async
   *
   * @return {Promise<AppSettings>}
   */
  export async function get(type: FileType) {
    const file = files[type][1]
    const data = await fileExists(file).then(exists => exists ? Fs.promises.readFile(file, "utf-8") : null)
    return hydrateData(data)
  }


  export function serializeData<T = any>(schema: ClazzOrModelSchema<T>, o: T) {
    return JSON.stringify(!!schema ? serialize(schema, o) : o)
  }

  /**
   * Load app settings async
   *
   * @return {Promise<AppSettings>}
   */
  export function saveSync(type: FileType, o: any) {
    const [schema, file] = files[type]
    const data = serializeData(schema, o)
    Fs.writeFileSync(file, data)
  }

  /**
   * Load app settings async
   *
   * @return {Promise<AppSettings>}
   */
  export async function save(type: FileType, o: any) {
    const [schema, file] = files[type]
    const data = serializeData(schema, o)
    await Fs.promises.writeFile(file, data)
  }

}
