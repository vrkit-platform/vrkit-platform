// import type { Inject as BackendInject } from "@nestjs/common"
import type { Inject as DitsyInject } from "@3fv/ditsy"

// export const NestInject: typeof BackendInject =
//   process.env.TARGET_PLATFORM === "node"
//     ? require("@nestjs/common").Inject
//     : v => v

export const CommonInject: typeof DitsyInject =
  require("@3fv/ditsy").Inject
