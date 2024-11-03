
declare global {
  const VRKIT_BUNDLED_MODULE_NAMES: string[]
  const VRKIT_BUNDLED_MODULE_ID_MAP: Record<string, string>
  const VRKIT_BUNDLED_MODULE_MAP: Record<string, any>
  
  const isElectronPackaged: boolean
}

export {}