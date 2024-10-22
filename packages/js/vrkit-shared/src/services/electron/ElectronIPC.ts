

export enum ElectronIPCChannel {
  openExternal = "openExternal",
  getNativeThemeSync = "getNativeThemeSync",
  nativeThemeChanged = "nativeThemeChanged",
  windowStatusChanged = "windowStatusChanged",
  settingsChanged = "settingsChanged",
  getAppSettings = "getAppSettings",
  saveAppSettings = "saveAppSettings",
  getAppSettingsSync = "getAppSettingsSync",
  saveAppSettingsSync = "saveAppSettingsSync",
  getWindowConfig = "getWindowConfig",
  showContextMenu = "showContextMenu",
  clickContextMenu = "clickContextMenu",
  invokeMainAction = "invokeMainAction",
  sharedAppStateChanged = "sharedAppStateChanged",
  fetchSharedAppState = "fetchSharedAppState"
}

export type ElectronIPCChannelKind = ElectronIPCChannel | `${ElectronIPCChannel}`
