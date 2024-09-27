import { WebPaths } from "./routes/WebPaths"

import packageJson from "../../package.json"


// ----------------------------------------------------------------------

export const DefaultConfig = {
  app: {
    name: "VRKit",
    basePath: "",
    version: packageJson.version
  }
}

export type AppConfig = typeof DefaultConfig
