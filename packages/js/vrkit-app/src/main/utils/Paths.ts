import { app } from "electron"


export function getUserDataDir() {
  return app.getPath("userData")
}
