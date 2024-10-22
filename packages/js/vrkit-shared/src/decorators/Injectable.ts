// import type { Injectable as BackendInjectable } from "@nestjs/common"
import type { Injectable as DitsyInjectable } from "@3fv/ditsy"

// export const NestInjectable: typeof BackendInjectable =
//   process.env.TARGET_PLATFORM === "node"
//     ? require("@nestjs/common").Injectable
//     : v => v

export const CommonInjectable: typeof DitsyInjectable =
  require("@3fv/ditsy").Injectable
