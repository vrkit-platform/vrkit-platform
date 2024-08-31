export const isDev = process.env.NODE_ENV !== "production"
export const isElectron = typeof process !== "undefined" && process?.versions?.electron?.length > 0

export const APP_SYNC_MANAGER_ID = "SYNC_MANAGER_ID"
export const APP_DB_ID = "APP_DB"

// ONLY IN DEV ENV TASK MANAGER CAN RUN IN MAIN RENDERER
export const isSharedWorkerEnabled = false// !isDev || !["false",false,0,"0"].includes(githubInSharedWorkerValue)

export const APP_STORE_ID = "APP_STORE_ID"

export const GlobalCSSClassNames = {
  electronWindowDraggable: "electronWindowDraggable",
  electronAllowInteraction: "electronAllowInteraction"
}

export enum AppDialogType {
  Unknown = "Unknown"
}


export type AppDialogTypeKind = AppDialogType | `${AppDialogType}`

